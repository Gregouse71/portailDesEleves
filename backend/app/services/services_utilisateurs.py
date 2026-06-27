# importer les models grace a __init__.py de models
from app.services import db
from app.models.models_utilisateurs import Utilisateur
from app.models.models_media import ElementMedia

from datetime import date, timedelta, datetime, timezone
from itertools import groupby
from sqlalchemy import func
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