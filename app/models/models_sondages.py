from app import db
from sqlalchemy.ext.mutable import MutableList
from datetime import date

# verification du format des donnees :
from ..utils.verification_format import *
from app.models.models_utilisateurs import Utilisateur


# LA LOGIQUE DES SONDAGES
# 
# Il y a quatre elements de la BDD qui gerent les sondages :
# - la table 'sondages_en_attente' qui contient tous les sondages non publies : valides et en attente, leurs questions, leurs reponses, 
# - la table 'anciens_sondages' qui contient tous les sondages parrus, leurs reponses et le vote par reponse
# - la variable globale 'id_sondage_du_jour' qui contient l'id dans 'sondage_en_attente' du sondage actuellement publie
# - la table 'votes_sondage_du_jour' qui contient les id des utilisateurs votant et leur reponse au sondage du jour     
# - la table *vote*, qui contient les votes aux sondages

class Sondage(db.Model):
    """
    Cette classe sert a stocker les nouveaux sondages, non encore publies, 
    et le sondage du jour. 
    L'id du sondage du jour est stocke dans la table des variables globales 
    Les votes du jour sont stockes dans la table 'votes_sondage_du_jour'
    Un sondage ne peut parraitre que si son tag "est_valide" est a True
    La route pour appeler la fonction qui modifiera ca sera protegee par le decorateur @vp_sondaj_required
   """
    __tablename__ = 'sondages_sondage'
    id = db.Column(db.Integer, primary_key=True)  # Clef primaire
    question = db.Column(db.String(1000), nullable=False)
    # reponses possibles
    reponses = db.Column(MutableList.as_mutable(db.JSON), nullable=False)
    # donnees du sondage
    propose_par_user_id = db.Column(db.Integer, nullable=False)
    autorise = db.Column(db.Boolean, nullable=False, default=False) # False : non autorise, True : en attente de publciation ou sondage du jour
    archive = db.Column(db.Boolean, nullable=False, default=False)
    date_proposition = db.Column(db.Date(), nullable=False)
    date_publication = db.Column(db.Date(), nullable=True)

    votes = db.relationship('VoteSondage', back_populates='sondage')
    gagnants = db.Column(MutableList.as_mutable(db.JSON), nullable=True)
    perdants = db.Column(MutableList.as_mutable(db.JSON), nullable=True)

    def __init__(self, propose_par_user_id:int, date_proposition: datetime.date, question:str, reponses: list[str], autorise:bool=False) :
        """
        Cree un nouveau sondage
        """
        self.propose_par_user_id = propose_par_user_id
        self.date_proposition = date_proposition
        self.question = question
        self.reponses = reponses


    def age (self):
        if not self.archive:
            return -1
        if self.date_publication is None:
            return 1e6
        return (date.today() - self.date_publication).days


class VoteSondage(db.Model):
    __tablename__ = 'sondages_vote'
    sondage_id = db.Column(db.Integer, db.ForeignKey('sondages_sondage.id'), primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), primary_key=True)

    sondage = db.relationship('Sondage', back_populates='votes')
    utilisateur = db.relationship('Utilisateur', back_populates='votes')
    vote = db.Column(db.Integer, nullable=False)
    gagnant = db.Column(db.Boolean, nullable=True)
    perdant = db.Column(db.Boolean, nullable=True)

    def __init__(self, sondage: Sondage, utilisateur: Utilisateur, vote: vote):
        if sondage.reponses[vote - 1] is None:
            raise Exception("Vote non possible au sondage")
        self.sondage = sondage
        self.utilisateur = utilisateur
        self.vote = vote

