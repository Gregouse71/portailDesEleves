from math import exp, sqrt

# importer les models grace a __init__.py de models
from app.services import db
from app.models.models_utilisateurs import Utilisateur
from app.models.models_sondages import VoteSondage, Sondage
from app.services.services_global import get_global_var, set_global_var
from datetime import datetime, date

# Erreur levee si l'une de ces fonctions echoue
class ErreurSondage(Exception):
    def __init__(self, message):
        super().__init__(message)


def proposer_sondage(question:str, reponses:list, utilisateur:Utilisateur) :
    """
    Ajouter un sondage dans la bdd. La liste des reponses possibles est au format ["reponse1", "reponse2", "reponse3"], de taille entre 2 et 4
    """
    proposition =  Sondage(question=question, reponses=reponses, propose_par_user_id=utilisateur.id, date_proposition=datetime.now())
    db.session.add(proposition)
    db.session.commit()


# TODO: METTRE decorateur sondage_du_jour_required sur le controller
def creer_vote_sondage_du_jour(utilisateur:Utilisateur, vote:int) :
    """
    Fait voter un utilisateur au sondage du jour
    Met a jour utilisateur.vote_sondaj_du_jour
    Met a jour le nombre de votes du sondage de la reponse du sondage en question dans la table "votes_sondage_du_jour"
    - vote doit etre 1, 2, 3 ou 4. Cette fonction ne verifie pas si le vote est possible (ex : reponse 4 alors qu'il n'y a que 3 reponses possibles)
    - il faudra aussi verifier s'il y a bien un sondage aujourd'hui
    """
    id_sondage_du_jour = get_global_var("id_sondage_du_jour")
    if id_sondage_du_jour is not None :
        utilisateur.vote_sondaj_du_jour = vote

        sondage_du_jour = Sondage.query.filter_by(id=id_sondage_du_jour).first()
        nouveau_vote = VoteSondage(sondage=sondage_du_jour, utilisateur=utilisateur, vote=vote)

        db.session.add(nouveau_vote)
        db.session.commit()
    else :
        raise ErreurSondage("Pas de sondage aujourd'hui, le vote est impossible")


def valider_sondage(id_sondage:int) :
    """
    Valide un sondage. Cette fonction ne pourra etre utilisee que par le vp_sondaj
    """
    sondage = db.session.get(Sondage, id_sondage)
    if sondage :
        if sondage.autorise :
            print("Sondage deja valide.")
        else :
            sondage.autorise = True
            db.session.commit()
    else :
        raise ValueError("id de sondage invalide")

# Passage d'un sondage a un autre 
# Les fonctions suivantes ne doivent etre utilisees qu'au sein d'une meme route
def _resultat_sondage(id_sondage) :
    """
    Renvoie la liste des nombres de votes du sondage du jour par option
    """
    compteur_votes = [VoteSondage.query.filter_by(sondage_id=id_sondage, vote=i).count() for i in range(1, 5)]
    return compteur_votes

def _donner_votes_gagnants_perdants(compteur_votes) :
    """prend en entree le tableau des votes, renvoie les numeros gagnants. Ne pas appliquer s'il n'y a pas eu de sondage ce jour"""
    gagnants = []
    maxi = -1

    perdants = []
    mini = compteur_votes[0] + 1

    for i in range(4) :
        if compteur_votes[i] > maxi :
            maxi = compteur_votes[i]
            gagnants = [i]
        elif compteur_votes[i] == maxi :
            gagnants.append(i)

        if 0 < compteur_votes[i] < mini:
            mini = compteur_votes[i]
            perdants = [i]
        elif compteur_votes[i] == mini:
            perdants.append(i)

    return gagnants, perdants


def sondage_suivant() -> None:
    """
    - regarde l'id du sondage du jour
    - si il y en a un regarde si il y a des votes
    - si il y en a, compte les votes, trouve les votes gagnants, trouve les votants et leur ajoute une victoire
    - archive le sondage du jour 
    - supprime le sondage du jour de la table des sondages en attente
    - trouve le nouveau sondage du jour, met son id dans la variable globale
    """
    id_ancien_sondage_du_jour = get_global_var("id_sondage_du_jour")
    # on met un nouveau sondage du jour
    nouveau_sondage_du_jour = Sondage.query.filter_by(autorise=True, archive=False).order_by(Sondage.date_proposition).first()
    if nouveau_sondage_du_jour :
        nouveau_sondage_du_jour.archive = True  # On archive le sondage
        nouveau_sondage_du_jour.date_publication = date.today ()  # On garde sa date de publication
        db.session.add(nouveau_sondage_du_jour)
        set_global_var("id_sondage_du_jour", nouveau_sondage_du_jour.id)
    else :
        set_global_var("id_sondage_du_jour", None)

    # On traite les résultats de l'ancien
    if id_ancien_sondage_du_jour :  # il y a un sondage du jour
        compteur_votes = _resultat_sondage(id_ancien_sondage_du_jour)  # On récupère le résultat
        gagnants, perdants = _donner_votes_gagnants_perdants(compteur_votes)  # On détermine les votes gagnants
        votes = VoteSondage.query.filter_by(sondage_id=id_ancien_sondage_du_jour).all()
        for vote in votes:  # Pour chaque vote, on détermine s'il est gagnant
            vote.gagnant = vote.vote in gagnants
            vote.perdant = vote.vote in perdants
            db.session.add(vote)

            user = vote.utilisateur
            user.vote_sondaj_du_jour = None
            db.session.add(user)

        sondage_du_jour = Sondage.query.filter_by(id=id_ancien_sondage_du_jour).first()
        sondage_du_jour.gagnants = gagnants
        sondage_du_jour.perdants = perdants
        db.session.add(sondage_du_jour)

    db.session.commit()
    update_all_scores ()
    print("Done")


def obtenir_sondages_non_valide() :
    """
    Renvoie les sondages non valides sous forme de liste de dictionnaires, classés par ordre décroissant de date
    """
    # Récupérer les sondages non validés triés par date décroissante
    sondages_non_valides = Sondage.query.filter_by(autorise=False, archive=False).order_by(Sondage.date_proposition.desc()).all()
    sondages_data = []
    for sondage in sondages_non_valides:
        sondages_data.append({
            "id": sondage.id,
            "question": sondage.question,
            "reponses": sondage.reponses,
            "propose_par_user_id": sondage.propose_par_user_id,
            "date_proposition": sondage.date_proposition,
            "status": sondage.autorise
        })
    return sondages_data

def obtenir_sondage_du_jour_et_votes():
    """
    Renvoie la question du sondage du jour, une liste des questions et une liste du nombre de votes pour chaque reponse.
    La taille des tableaux de résultats est ajustee en fonction du nombre de reponses disponibles (2, 3 ou 4).
    Si il n'y a pas de sondage aujourd'hui, renvoie None
    Exemple de retour :
    ("question ?", ["reponse1", "reponse2", None, None], [1,96,0,0])
    """
    id_sondage_du_jour = get_global_var("id_sondage_du_jour")
    if id_sondage_du_jour:
        sondage_du_jour = Sondage.query.filter_by(id=id_sondage_du_jour).first()
        question_du_jour = sondage_du_jour.question
        reponses_brut = sondage_du_jour.reponses
        compteur_votes = _resultat_sondage(id_sondage_du_jour)

        return question_du_jour, reponses_brut, compteur_votes
    else :
        return None

def supprimer_sondage(id_sondage) :
    """
    Supprime un sondage de la table 'sondages'
    """
    sondage = db.session.get(Sondage, id_sondage)  # Recherche le sondage par ID
    if not sondage:
        raise ValueError("Sondage introuvable.")  # Lève une exception si l'ID est invalide

    db.session.delete(sondage)  # Supprime le sondage
    db.session.commit()


def score_recent_sondages (id: int):
    """
    Calcul le score courant de l'utilisateur : la moyenne pondérée avec coefficients décroissants en exponentielle
    """
    score_recent = 0

    votes = VoteSondage.query.filter_by(utilisateur_id=id).all()
    for vote in votes:
        valeur = 0
        if vote.gagnant:
            valeur += 1
        if vote.perdant:
            valeur -= 1
        
        score_recent += exp(- vote.sondage.age() / 14) * valeur

    return 100 * score_recent

def _wilson(total, n):
    z = 1.64485 # 1.0 = 85%, 1.6 = 95%
    avg = total/n

    T1 = z/2 * sqrt( (avg*(1 - avg) + z**2/4/n) / n) 
    return 100 * (avg + z**2/2/n + T1) / (1 + z**2/n) # Formule de Wilson (tirée de l'ancien portail)

def score_global_sondages(id: int):
    """
    Calcul le score global de l'utilisateur : la borne inf de l'intervalle de confiance
    """
    votes = VoteSondage.query.filter_by(utilisateur_id=id).with_entities(VoteSondage.gagnant, VoteSondage.perdant).all()

    n = len(votes)
    total_gagant = 0
    total_perdant = 0
    if n == 0:
        return 0, 0

    for vote in votes:
        if vote.gagnant:
            total_gagant += 1
        if vote.perdant:
            total_perdant += 1

    return _wilson(total_gagant, n), _wilson(total_perdant, n)
    # return avg - 1.96 * sigma / sqrt(n), avg + 1.96 * sigma / sqrt(n)


def update_all_scores ():
    users = Utilisateur.query.all()
    for user in users:
        user.score_recent = score_recent_sondages (user.id)
        con, div = score_global_sondages (user.id)  # Score consensuel, divergent

        user.score_global_con = con
        user.score_global_div = div
        db.session.add(user)
        db.session.commit()
