from datetime import datetime, timezone

from app import db


class Livre(db.Model):
    __tablename__ = "bibliotheque_livres"
    id = db.Column(db.Integer, primary_key=True)
    asso_id = db.Column(db.Integer, db.ForeignKey("associations_association.id"), nullable=False, index=True)

    auteur = db.Column(db.String(500))
    edition = db.Column(db.String(255))
    serie = db.Column(db.String(255), nullable=False)
    tome = db.Column(db.String(50))
    reference = db.Column(db.String(100))
    etat = db.Column(db.String(50))

    disponible = db.Column(db.Boolean, nullable=False, default=True)

    emprunts = db.relationship(
        "EmpruntLivre",
        back_populates="livre",
        order_by="desc(EmpruntLivre.date_emprunt)",
        cascade="all, delete-orphan",
    )

    def __init__(self, asso_id: int, serie: str, auteur: str = None, edition: str = None,
                 tome: str = None, reference: str = None, etat: str = None):
        self.asso_id = asso_id
        self.serie = serie
        self.auteur = auteur
        self.edition = edition
        self.tome = tome
        self.reference = reference
        self.etat = etat
        self.disponible = True

    def emprunt_en_cours(self):
        """ Retourne l'emprunt actif du livre, ou None si le livre est disponible """
        for e in self.emprunts:
            if e.date_retour is None:
                return e
        return None

    def nom_affichage(self):
        """ Nom lisible utilise dans l'interface : "Serie - Tome X" ou juste "Serie" """
        if self.tome:
            return f"{self.serie} - Tome {self.tome}"
        return self.serie

    def patch(self, data: dict):
        self.serie = data.get("serie", self.serie)
        self.auteur = data.get("auteur", self.auteur)
        self.edition = data.get("edition", self.edition)
        self.tome = data.get("tome", self.tome)
        self.reference = data.get("reference", self.reference)
        self.etat = data.get("etat", self.etat)
        db.session.commit()

    def to_dict(self):
        emprunt = self.emprunt_en_cours()
        return {
            "id": self.id,
            "asso_id": self.asso_id,
            "serie": self.serie,
            "tome": self.tome,
            "nom_affichage": self.nom_affichage(),
            "auteur": self.auteur,
            "edition": self.edition,
            "reference": self.reference,
            "etat": self.etat,
            "disponible": self.disponible,
            "emprunt": emprunt.to_dict() if emprunt else None,
        }


class EmpruntLivre(db.Model):
    """
    Historique des emprunts.
    Un emprunt "en cours" a date_retour == None.
    """
    __tablename__ = "bibliotheque_emprunts"
    id = db.Column(db.Integer, primary_key=True)

    livre_id = db.Column(db.Integer, db.ForeignKey("bibliotheque_livres.id"), nullable=False)
    livre = db.relationship("Livre", back_populates="emprunts")

    utilisateur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs_utilisateur.id"), nullable=False)
    utilisateur = db.relationship("Utilisateur", foreign_keys=[utilisateur_id])

    # Qui a enregistre l'operation
    auteur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs_utilisateur.id"))
    auteur = db.relationship("Utilisateur", foreign_keys=[auteur_id])

    date_emprunt = db.Column(db.DateTime, nullable=False)
    date_retour = db.Column(db.DateTime, nullable=True)

    def __init__(self, livre, utilisateur, auteur=None):
        self.livre = livre
        self.utilisateur = utilisateur
        self.auteur = auteur
        self.date_emprunt = datetime.now(timezone.utc)

    def to_dict(self):
        return {
            "id": self.id,
            "livre_id": self.livre_id,
            "livre_nom": self.livre.nom_affichage(),
            "utilisateur_id": self.utilisateur_id,
            "utilisateur": self.utilisateur.nom_utilisateur,
            "auteur": self.auteur.nom_utilisateur if self.auteur else None,
            "date_emprunt": self.date_emprunt.isoformat() + "Z",
            "date_retour": self.date_retour.isoformat() + "Z" if self.date_retour else None,
        }