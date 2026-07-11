from app import db
import os
import re

from app.models.models_utilisateurs import Utilisateur
from app.models.models_media import ElementMedia

from config import Config


class AssociationCotisation(db.Model):
    __tablename__ = 'associations_cotisation'
    id = db.Column(db.Integer, primary_key=True)

    nom = db.Column(db.String(1000), nullable=False)

    association_id = db.Column(db.Integer, db.ForeignKey('associations_association.id'), nullable=False)
    association = db.relationship('Association', backref=db.backref('cotisations', uselist=False))

    date_debut = db.Column(db.Date(), nullable=False)
    date_fin = db.Column(db.Date(), nullable=False)

    def __init__(self):
        pass

    def __repr__(self):
        """
        Methode optionnelle, mais utile pour deboguer et afficher l'association.
        """
        return f"<Cotisation {self.nom}>"

    def update(self):
        pass
    
    def to_dict(self):
        return {}


class AssociationCotisationUtilisateur(db.Model):
    __tablename__ = 'associations_cotisation_utilisateur'
    id = db.Column(db.Integer, primary_key=True)

    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'))
    cotisation_id = db.Column(db.Integer, db.ForeignKey('associations_cotisation.id'))

    utilisateur = db.relationship('Utilisateur', back_populates='cotisations')
    cotisation = db.relationship('AssociationCotisation', back_populates='membres')

    def __init__(self):
        pass

    def __repr__(self):
        return f"<Cotisation utilisateur_id={self.utilisateur_id} cotisation_id={self.cotisation_id}>"