# importer les models grace a __init__.py de models
from app.services import db
from app.models.models_utilisateurs import Utilisateur
from app.models.models_media import ElementMedia

from datetime import date, timedelta, datetime, timezone
from itertools import groupby
from sqlalchemy import func
from collections import deque
import secrets
import string
import os

# Erreur levee si l'une de ces fonctions echoue
class ErreurDeLienUtilisateurs(Exception):
    def __init__(self, message):
        super().__init__(message)

def add_utilisateur(nom_utilisateur: str, 
                    email: str,
                    prenom: str, 
                    nom: str, 
                    promotion: str, 
                    cycle: str,
                    mot_de_passe_en_clair: None | str = None) -> Utilisateur:
    """Ajoute un utilisateur dans la base de données s'il n'existe pas déjà

    Renvoie l'id de l'utilisateur créé"""

    if mot_de_passe_en_clair is None:
        alphabet = string.ascii_letters + string.digits
        mot_de_passe_en_clair = ''.join(secrets.choice(alphabet) for i in range(20)) # mdp random de 20 caractères, que l'utilisateur devra changer

    user = Utilisateur(
        nom_utilisateur=nom_utilisateur,
        email=email,
        prenom=prenom,
        nom=nom,
        promotion=promotion,
        cycle=cycle,
        mot_de_passe_en_clair=mot_de_passe_en_clair
    )
    db.session.add(user) # try except ?
    db.session.commit()
    return user.id
# CO

def get_utilisateur(utilisateur_id) -> Utilisateur:  
    """Renvoie un utilisateur depuis son id"""
    if utilisateur_id:
        return db.session.get(Utilisateur, utilisateur_id)
    else:
        return None

def supprimer_co(utilisateur1:Utilisateur, utilisateur2:Utilisateur) :
    """
    Supprime le lien de colocation entre les deux utilisateurs. 
    Leve si les deux utilisateurs ne sont pas co
    """
    if utilisateur2 in utilisateur1.cos and utilisateur1 in utilisateur2.cos:
        utilisateur1.cos.remove(utilisateur2)
        utilisateur2.cos.remove(utilisateur1)
        db.session.commit()
    else :
        raise ErreurDeLienUtilisateurs("Erreur : les deux utilisateurs ne sont pas co.")

def ajouter_co(utilisateur1:Utilisateur, utilisateur2:Utilisateur) :
    """
    Ajoute un lien de colocation entre deux utilisateurs.
    """
    if utilisateur2 not in utilisateur1.cos:
        utilisateur1.cos.append(utilisateur2)
    if utilisateur1 not in utilisateur2.cos:
        utilisateur2.cos.append(utilisateur1)
    db.session.commit()

def changer_co(utilisateur:Utilisateur, liste_cos:list[Utilisateur]) :
    """
    Change la liste des cos d'un utilisateur.
    """
    # Supprimer les anciennes relations
    for co in utilisateur.cos:
        co.cos.remove(utilisateur)

    # Ajouter les nouvelles relations
    utilisateur.cos = liste_cos
    for co in liste_cos:
        co.cos.append(utilisateur)

    db.session.commit()

# PARRAINAGE

def ajouter_fillots_a_la_famille(marrain:Utilisateur, liste_fillots:list[Utilisateur]) :
    """
    Ajoute une liste de fillots a la famille. 
    Si l'un des fillots possede deja un marrain, le lien est detruit. 
    """
    fillots_a_ajouter = []
    for fillot in liste_fillots:
        # si le fillot a un marrain qui n'est pas le marrain actuel
        if fillot.marrains != [] and fillot not in marrain.fillots:
            fillot.marrains = []
            fillots_a_ajouter.append(fillot)
        # si le fillot n'a pas de marrain
        elif fillot.marrains == []:
            fillots_a_ajouter.append(fillot)
        # si le fillot a déjà le marrain actuel comme marrain, on ne fait rien

    # modification
    marrain.fillots.extend(fillots_a_ajouter)
    db.session.commit()


def supprimer_fillots(marrain:Utilisateur) :
    """
    Supprime les fillots d'un utilisateur. Ne renvoie pas d'erreur si l'utilisateur n'a pas de fillot. 
    Supprime donc en consequence le marrain des fillots concernes
    """
    if marrain.fillots:
        marrain.fillots = []
        db.session.commit()

def changer_marrain(marrain:Utilisateur, fillot:Utilisateur):
    """
    Change le marrain d'un fillot.
    Si le fillot avait déjà un marrain, le lien est détruit.
    """
    fillot.marrains = [marrain]
    db.session.commit()

# AUTRES

def prochains_anniv():
    def must_display(d):
        if d is None:
            return False
        today = datetime.now(timezone.utc).date()
        date1 = date(year=2000, month=d.month, day=d.day)
        date2 = date(year=2000, month=today.month, day=today.day)

        return (date2 <= date1 <= date2 + timedelta(days=7)
                or date2 <= date1 + timedelta(days=365) <= date2 + timedelta(days=7))

    now = datetime.now(timezone.utc).date().replace(year=2000)
    def aux(user):
        """
        Renvoie la distance entre la date de naissance de use et la date d'aujourd'hui
        sans prendre en compte l'année.
        """
        temp = (user[0] - now).days
        if temp >= 0:
            return temp
        return (user[0].replace(year=2001) - now).days

    # C'est horrible. Il faudrait vraiment que les promos soient des entiers
    max_promo = int(db.session.query(func.max(Utilisateur.promotion)).first()[0])
    promos_to_consider = [max_promo - i for i in range(4)]

    users = db.session.query(Utilisateur.id, Utilisateur.prenom, Utilisateur.nom, Utilisateur.cycle, Utilisateur.promotion, Utilisateur.date_de_naissance)\
        .filter(Utilisateur.promotion.in_(promos_to_consider))\
        .all()


    ret = sorted(
            [(user.date_de_naissance.replace(year=2000), user.prenom, user.nom, user.cycle, user.promotion, user.id) for user in users if must_display(user.date_de_naissance)],
            key=aux)
    ret = [(k, list(map(lambda x: (x[1], x[2], x[3], x[4], x[5]), list(g)))) for k, g in groupby(ret, lambda x: x[0])]
    return ret


def get_user_media(user_id):
    files = ElementMedia.query.filter_by(utilisateur_id=user_id, cache=False)
    return [f.to_dict() for f in files]


def set_user_photo(user_id: int, media_id: int):
    """Met à jour la photo de profil d'un utilisateur."""
    user = get_utilisateur(user_id)
    if user:
        user.photo_id = media_id
        db.session.commit()


def set_user_banniere(user_id: int, banniere_id: str):
    """Met à jour la bannière d'un utilisateur."""
    user = get_utilisateur(user_id)
    if user:
        user.banniere_id = banniere_id
        db.session.commit()


def marrainage_valide(marrain: Utilisateur, fillot: Utilisateur) -> bool:
    return (
        marrain.est_visible
        and fillot.est_visible
        and int(marrain.promotion) <= int(fillot.promotion)
    )


def obtenir_famille(utilisateur: Utilisateur) -> dict:
    """
    Construit l'arbre généalogique complet (ascendants + descendants) d'un utilisateur. 
    Renvoie :
    {
        "noeuds": [{"id", "nom_utilisateur", "promotion"}, ...],
        "liens":  [{"source": marrain_id, "cible": fillot_id, "type": "marrainage"}, ...]
    }
    """
    noeuds = {}
    liens = []
    ids_vus = {utilisateur.id}
    a_visiter = [utilisateur]
 
    def ajouter_noeud(u: Utilisateur):
        noeuds[u.id] = {
            "id": u.id,
            "nom_utilisateur": u.nom_utilisateur,
            "promotion": int(u.promotion),
        }
 
    ajouter_noeud(utilisateur)
 
    while a_visiter:
        courant = a_visiter.pop()
 
        # Ascendants : les marrains du courant
        for marrain in courant.marrains:
            if not marrainage_valide(marrain, courant):
                continue
            liens.append({"source": marrain.id, "cible": courant.id, "type": "marrainage"})
            if marrain.id not in ids_vus:
                ids_vus.add(marrain.id)
                ajouter_noeud(marrain)
                a_visiter.append(marrain)
 
        # Descendants : les fillots du courant
        for fillot in courant.fillots:
            if not marrainage_valide(courant, fillot):
                continue
            liens.append({"source": courant.id, "cible": fillot.id, "type": "marrainage"})
            if fillot.id not in ids_vus:
                ids_vus.add(fillot.id)
                ajouter_noeud(fillot)
                a_visiter.append(fillot)
 
    return {"noeuds": list(noeuds.values()), "liens": liens}
 
 
def _construire_graphe_combine() -> dict:
    """
    Graphe non orienté {user_id: {voisin_ids}} combinant les relations
    marrain-fillot et colocation (cos). Utilisé pour le calcul du plus court
    chemin entre deux utilisateurs.
    """
    utilisateurs = Utilisateur.query.filter_by(est_visible=True).all()
    graphe = {}
 
    def ajouter_arc(a, b):
        graphe.setdefault(a, set()).add(b)
        graphe.setdefault(b, set()).add(a)
 
    for u in utilisateurs:
        for fillot in u.fillots:
            if not marrainage_valide(u, fillot):
                continue
            ajouter_arc(u.id, fillot.id)

        for co in u.cos:
            if not co.est_visible:
                continue
            ajouter_arc(u.id, co.id)
 
    return graphe
 
 
def obtenir_chemin(utilisateur1: Utilisateur, utilisateur2: Utilisateur) -> dict:
    """
    Calcule le plus court chemin entre deux utilisateurs, puis complète le
    graphe affiché en explorant les relations marrain-fillot des personnes
    du chemin (et de proche en proche).
 
    L'intervalle de promotion de référence [promo_min, promo_max] est celui
    des deux utilisateurs demandés (pas de tout le chemin) : si le chemin
    passe par des personnes dont la promotion est hors de cet intervalle
    (parce que le plus court chemin est passé par des colocations vers des
    promotions plus extrêmes), on les complète quand même, mais seulement
    en direction de l'intervalle -- un candidat marrain ou fillot n'est
    ajouté que si sa promotion RAPPROCHE de l'intervalle par rapport à la
    personne courante (ou si elle est déjà dedans). Une fois rentré dans
    l'intervalle, l'exploration reste normale (ne peut plus en ressortir,
    puisqu'aucun candidat ne peut être "plus proche que 0").
 
    Renvoie :
    {
        "chemin": [id1, id2, ...],
        "noeuds": [{"id", "nom_utilisateur", "promotion"}, ...],
        "liens":  [{"source", "cible", "type": "chemin" | "marrainage", "relation"?: "marrainage" | "co"}, ...]
    }
    Renvoie des listes vides si aucun chemin n'existe entre les deux.
    """
    if utilisateur1.id == utilisateur2.id:
        return {"chemin": [utilisateur1.id], "noeuds": [{
            "id": utilisateur1.id,
            "nom_utilisateur": utilisateur1.nom_utilisateur,
            "promotion": int(utilisateur1.promotion),
        }], "liens": []}
 
    graphe = _construire_graphe_combine()
 
    precedent = {utilisateur1.id: None}
    file_attente = deque([utilisateur1.id])
    while file_attente:
        courant = file_attente.popleft()
        if courant == utilisateur2.id:
            break
        for voisin in graphe.get(courant, ()):
            if voisin not in precedent:
                precedent[voisin] = courant
                file_attente.append(voisin)
 
    if utilisateur2.id not in precedent:
        return {"chemin": [], "noeuds": [], "liens": []}
 
    chemin = []
    courant = utilisateur2.id
    while courant is not None:
        chemin.append(courant)
        courant = precedent[courant]
    chemin.reverse()
 
    utilisateurs_chemin = Utilisateur.query.filter(Utilisateur.id.in_(chemin)).all()
    par_id_chemin = {u.id: u for u in utilisateurs_chemin}
 
    # Intervalle de référence : uniquement les 2 utilisateurs demandés, pas
    # tout le chemin (voir docstring).
    promo_min = min(int(utilisateur1.promotion), int(utilisateur2.promotion))
    promo_max = max(int(utilisateur1.promotion), int(utilisateur2.promotion))
 
    def distance_intervalle(promo):
        """Distance d'une promotion à l'intervalle [promo_min, promo_max] ;
        0 si elle est dedans."""
        if promo < promo_min:
            return promo_min - promo
        if promo > promo_max:
            return promo - promo_max
        return 0
 
    # Liens du chemin : on retrouve la vraie nature de la relation
    # (marrainage, avec le bon sens marrain -> fillot, ou colocation)
    liens = []
    for i in range(len(chemin) - 1):
        a_id, b_id = chemin[i], chemin[i + 1]
        a, b = par_id_chemin[a_id], par_id_chemin[b_id]
        if any(marrainage_valide(a, f) and f.id == b_id for f in a.fillots):
            liens.append({"source": a_id, "cible": b_id, "type": "chemin", "relation": "marrainage"})
        elif any(marrainage_valide(m, a) and m.id == b_id for m in a.marrains):
            liens.append({"source": b_id, "cible": a_id, "type": "chemin", "relation": "marrainage"})
        else:
            liens.append({"source": a_id, "cible": b_id, "type": "chemin", "relation": "co"})
    paires_deja_liees = {(l["source"], l["cible"]) for l in liens}
 
    # Complète le graphe en explorant, de proche en proche, les relations marrain-fillot des personnes ajoutées.
    # si le chemin passe par plus de 2 relations de co ou si l'écart de promo est plus grand que 8, on ne complète que les arbres des 2 extrémités
 
    liens_co = [l for l in liens if l.get("relation") == "co"]
 
    if len(liens_co) > 2 and (promo_max - promo_min) >= 3:
        ids_depart = {utilisateur1.id, utilisateur2.id}
    elif (promo_max - promo_min) >= 6:
        ids_depart = {utilisateur1.id, utilisateur2.id}
    else:
        ids_depart = set(chemin)
 
    noeuds_par_id = dict(par_id_chemin)
 
    def ajouter_noeud(u):
        if u.id not in noeuds_par_id:
            noeuds_par_id[u.id] = u
 
    marrains_explores = set()
 
    def explorer_marrains(utilisateur):
        pile = [utilisateur]
 
        while pile:
            courant = pile.pop()
            if courant.id in marrains_explores:
                continue
            marrains_explores.add(courant.id)
 
            d_courant = distance_intervalle(int(courant.promotion))
 
            for marrain in courant.marrains:
                if not marrainage_valide(marrain, courant):
                    continue
 
                d_marrain = distance_intervalle(int(marrain.promotion))
                # On accepte le marrain s'il est dans l'intervalle, ou s'il
                # en rapproche strictement par rapport à `courant`.
                if not (d_marrain == 0 or d_marrain < d_courant):
                    continue
 
                paire = (marrain.id, courant.id)
 
                if paire not in paires_deja_liees:
                    liens.append({
                        "source": marrain.id,
                        "cible": courant.id,
                        "type": "marrainage",
                    })
                    paires_deja_liees.add(paire)
 
                ajouter_noeud(marrain)
                if marrain.id not in marrains_explores:
                    pile.append(marrain)
 
    fillots_explores = set()
 
    def explorer_fillots(utilisateur):
        pile = [utilisateur]
 
        while pile:
            courant = pile.pop()
            if courant.id in fillots_explores:
                continue
            fillots_explores.add(courant.id)
 
            d_courant = distance_intervalle(int(courant.promotion))
 
            for fillot in courant.fillots:
                if not marrainage_valide(courant, fillot):
                    continue
 
                d_fillot = distance_intervalle(int(fillot.promotion))
                # On accepte le fillot s'il est dans l'intervalle, ou s'il
                # en rapproche strictement par rapport à `courant`.
                if not (d_fillot == 0 or d_fillot < d_courant):
                    continue
 
                paire = (courant.id, fillot.id)
 
                if paire not in paires_deja_liees:
                    liens.append({
                        "source": courant.id,
                        "cible": fillot.id,
                        "type": "marrainage",
                    })
                    paires_deja_liees.add(paire)
 
                ajouter_noeud(fillot)
                if fillot.id not in fillots_explores:
                    pile.append(fillot)
 
    utilisateurs_depart = Utilisateur.query.filter(Utilisateur.id.in_(ids_depart)).all()
 
    for utilisateur in utilisateurs_depart:
        explorer_marrains(utilisateur)
        explorer_fillots(utilisateur)
 
    noeuds = [
        {"id": u.id, "nom_utilisateur": u.nom_utilisateur, "promotion": int(u.promotion)}
        for u in noeuds_par_id.values()
    ]
 
    return {"chemin": chemin, "noeuds": noeuds, "liens": liens}