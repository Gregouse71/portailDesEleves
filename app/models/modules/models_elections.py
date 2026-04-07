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
    # Faut-il chiffrer les votes ?
    chiffree = db.Column(db.Boolean, nullable=False, default=False)
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
    votes_chiffres = db.relationship('ElectionVoteChiffre', backref='election', cascade="all, delete-orphan")

    def __init__(
        self, association, nom: str, options: list[str], chiffree=False
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
        self.chiffree = chiffree

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
            "chiffree" : self.chiffree,
            "date_ouverture": self.date_ouverture.isoformat() if self.date_ouverture is not None else None,
            "date_fermeture": self.date_fermeture.isoformat() if self.date_fermeture is not None else None,
            "ouvert" : (self.date_ouverture <= datetime.now() <= self.date_fermeture) if self.date_ouverture is not None and self.date_fermeture is not None else None
        }


class ElectionVote(db.Model):
    __tablename__ = 'elections_vote'

    choix = db.Column(db.Integer, nullable=True)
    date = db.Column(db.DateTime, nullable=False)

    # Association
    election_id = db.Column(db.Integer, db.ForeignKey('elections_election.id'), primary_key=True)

    # Utilisateur
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), primary_key=True)
    utilisateur = db.relationship('Utilisateur', backref='votes_elections')

    def __init__(
        self, choix: int | None, election: Election, utilisateur: Utilisateur
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


class ElectionVoteChiffre(db.Model):
    __tablename__ = 'elections_vote_chiffre'
    id = db.Column(db.Integer, primary_key=True)

    date = db.Column(db.Date, nullable=False)
    choix = db.Column(db.Integer, nullable=False)
    ciphertext = db.Column(db.Text, nullable=False)

    promotion = db.Column(db.String(4), nullable=True)
    etage = db.Column(db.Integer, nullable=True)
    cycle = db.Column(db.String(10), nullable=True)

    election_id = db.Column(db.Integer, db.ForeignKey('elections_election.id'))

    def __init__(
        self, choix: int, election: Election, ciphertext: str, utilisateur: Utilisateur
    ):
        self.choix = choix
        self.date = datetime.now().date()
        self.election = election
        self.ciphertext = ciphertext

        self.promotion = utilisateur.promotion
        self.cycle = utilisateur.cycle

        try:
            e = int(utilisateur.chambre[-3:]) // 100
            if e == 0:  # Si la chambre est une 100X
                e = 1
            self.etage = e
        except ValueError:
            self.etage = None

    def __repr__(self):
        """
        Methode optionnelle, mais utile pour deboguer et afficher l'association.
        """
        return f"<Vote {self.id}>"


    def to_dict(self):
        return {
            
        }