from app import db
import os
import re
from datetime import datetime

from app.models.models_media import ElementMedia

from config import Config


class AssociationCotisation(db.Model):
    __tablename__ = 'associations_cotisation'
    id = db.Column(db.Integer, primary_key=True)

    nom = db.Column(db.String(1000), nullable=False)

    association_id = db.Column(db.Integer, db.ForeignKey('associations_association.id'), nullable=False)
    association = db.relationship('Association', backref=db.backref('cotisations', lazy='dynamic'))

    date_debut = db.Column(db.Date(), nullable=False)
    date_fin = db.Column(db.Date(), nullable=False)

    membres = db.relationship('AssociationCotisationUtilisateur', back_populates='cotisation', cascade="all, delete-orphan")

    def __init__(self, nom, association, date_debut, date_fin):
        self.nom = nom
        self.association = association
        self.date_debut = date_debut
        self.date_fin = date_fin

    def __repr__(self):
        """
        Methode optionnelle, mais utile pour deboguer et afficher l'association.
        """
        return f"<Cotisation {self.nom}>"

    def update(self, data):
        self.nom = data.get("nom", self.nom)
        from datetime import datetime
        if "date_debut" in data and data["date_debut"]:
            self.date_debut = data["date_debut"]
        if "date_fin" in data and data["date_fin"]:
            self.date_fin = data["date_fin"]
    
    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "association_id": self.association_id,
            "date_debut": self.date_debut.isoformat() if self.date_debut else None,
            "date_fin": self.date_fin.isoformat() if self.date_fin else None,
            "membres": [{
                "id": m.utilisateur.id,
                "nom_utilisateur": m.utilisateur.nom_utilisateur,
                "prenom": m.utilisateur.prenom,
                "nom": m.utilisateur.nom,
                "promotion": m.utilisateur.promotion
            } for m in self.membres if m.utilisateur]
        }


class AssociationCotisationUtilisateur(db.Model):
    __tablename__ = 'associations_cotisation_utilisateur'
    id = db.Column(db.Integer, primary_key=True)

    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'))
    cotisation_id = db.Column(db.Integer, db.ForeignKey('associations_cotisation.id'))

    utilisateur = db.relationship('Utilisateur', back_populates='cotisations')
    cotisation = db.relationship('AssociationCotisation', back_populates='membres')

    def __init__(self, utilisateur_id, cotisation):
        self.utilisateur_id = utilisateur_id
        self.cotisation = cotisation

    def __repr__(self):
        return f"<Cotisation utilisateur_id={self.utilisateur_id} cotisation_id={self.cotisation_id}>"

    def to_dict(self):
        return {
            "id": self.id,
            "utilisateur_id": self.utilisateur_id,
            "cotisation_id": self.cotisation_id,
            "utilisateur": self.utilisateur.id,
            "asso": self.cotisation.association.nom
        }

    def est_active(self):
        today = datetime.now().date()
        return self.cotisation.date_debut <= today <= self.cotisation.date_fin