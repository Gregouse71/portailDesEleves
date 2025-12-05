from app import db
from datetime import datetime
from flask import jsonify

from app.models.models_utilisateurs import Utilisateur

class Message(db.Model):
    __tablename__ = 'chat_messages'
    # ID du message
    id = db.Column(db.Integer, primary_key=True)

    # Éléments ajoutés à la création de l'association — Modifiables par les membres de l'association
    text = db.Column(db.String(1000), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'))
    utilisateur = db.relationship('Utilisateur', back_populates='messages')


    def __init__(self, text: str, author: Utilisateur, date: datetime):
        """
        Crée une nouvelle association
        """
        self.text = text
        self.utilisateur = author
        self.date = date
    
    def save(self):
        db.session.add(self)
        db.session.commit()

    def to_dict(self):
        return {
            "text": self.text,
            "time": self.date.strftime ("%d/%m/%Y %H:%M"),
            "author": self.utilisateur.nom_utilisateur,
            "author_id": self.utilisateur.id,
            "id": self.id
        }
