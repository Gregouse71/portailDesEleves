from sqlalchemy.ext.mutable import MutableList
from datetime import datetime

from app import db
from app.models.models_utilisateurs import Utilisateur

import locale
locale.setlocale (locale.LC_ALL, 'fr_FR.UTF-8')
# Cette table sert à stocker les relations entre Association et Utilisateur


class Election(db.Model):
    __tablename__ = 'elections_election'
    # ID de l'association
    id = db.Column(db.Integer, primary_key=True)

    nom = db.Column(db.String(1000), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    # Faut-il l'afficher pour tous les utilisateurs ?
    visible = db.Column(db.Boolean, nullable=False, default=False)
    # Votes possibles
    options = db.Column(MutableList.as_mutable(db.JSON), nullable=False)
    # Promos pouvant voter (TODO : ajouter possibilité de choisir les utilisateurs particuliers ?)
    promos = db.Column(MutableList.as_mutable(db.JSON), nullable=False)

    # Début et fin des votes, en heure de Paris
    date_ouverture = db.Column(db.DateTime)
    date_fermeture = db.Column(db.DateTime)

    # Association
    association_id = db.Column(db.Integer, db.ForeignKey('associations_association.id'))
    association = db.relationship('Association', backref=db.backref('elections', lazy='dynamic'))
    
    # Votes
    votes = db.relationship('ElectionVote', backref='election', cascade="all, delete-orphan")

    def __init__(
        self, association, nom: str, options: list[str]
    ):
        """
        Crée une nouvelle élection
        """
        self.nom = nom
        self.description = ""
        self.visible = False
        self.options = options
        self.promos = []
        self.association = association

    def __repr__(self):
        """
        Methode optionnelle, mais utile pour deboguer et afficher l'association.
        """
        return f"<Election {self.id}>"

    
    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "description": self.description,
            "visible": self.visible,
            "options": self.options,
            "promos" : self.promos,
            "date_ouverture": self.date_ouverture.isoformat() if self.date_ouverture is not None else None,
            "date_fermeture": self.date_fermeture.isoformat() if self.date_fermeture is not None else None,
            "ouvert" : (self.date_ouverture <= datetime.now() <= self.date_fermeture) if self.date_ouverture is not None and self.date_fermeture is not None else None
        }

    def patch(self, data):
        """
        Modifie l'objet avec les clés dans data.
        Ce qui n'est pas précisé n'est pas changé.
        """
        self.nom = data.get("nom", self.nom)
        self.description = data.get("description", self.description)
        self.visible = data.get("visible", self.visible)
        self.options = data.get("options", self.options)
        self.promos = data.get("promos", self.promos)
        self.date_ouverture = data.get("date_ouverture", self.date_ouverture)
        self.date_fermeture = data.get("date_fermeture", self.date_fermeture)


class ElectionVote(db.Model):
    __tablename__ = 'elections_vote'

    choix = db.Column(db.Integer, nullable=False)
    date = db.Column(db.DateTime, nullable=False)

    # Association
    election_id = db.Column(db.Integer, db.ForeignKey('elections_election.id'), primary_key=True)
    
    # Utilisateur
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), primary_key=True)
    utilisateur = db.relationship('Utilisateur', backref='votes_elections')

    def __init__(
        self, choix: int, election: Election, utilisateur: Utilisateur
    ):
        self.choix = choix
        self.date = datetime.now()
        self.election = election
        self.utilisateur = utilisateur

    def __repr__(self):
        """
        Methode optionnelle, mais utile pour deboguer et afficher l'association.
        """
        return f"<Vote {self.id}>"


    def to_dict(self):
        return {}