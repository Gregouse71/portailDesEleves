from datetime import datetime, timezone

from app import db


class OperationSoifguard(db.Model):
    __tablename__ = "soifguard_operation"
    id = db.Column(db.Integer, primary_key=True)

    date = db.Column(db.DateTime, nullable=False)  #  Date de la transaction
    est_cotisant = db.Column(db.Boolean, nullable=False, default=False)  #  Statut cotisant au moment de l'opération
    libelle = db.Column(db.String(1000))  #  Libellé de l'opération
    somme = db.Column(db.Float, nullable=False)  #  Variation du solde de l'utilisateur à la suite
    asso = db.Column(db.String(100), nullable=False)

    solde_avant = db.Column(db.Float, nullable=False)  #  Variation du solde de l'utilisateur à la suite
    solde_apres = db.Column(db.Float, nullable=False)  #  Variation du solde de l'utilisateur à la suite

    utilisateur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs_utilisateur.id"))
    utilisateur = db.relationship("Utilisateur", back_populates="operations", foreign_keys=[utilisateur_id])
    auteur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs_utilisateur.id"))
    auteur = db.relationship("Utilisateur", back_populates="credits_asso", foreign_keys=[auteur_id])

    def __init__(self, asso, utilisateur, auteur, est_cotisant, libelle: str, somme: float):
        self.date = datetime.now(timezone.utc)
        self.est_cotisant = est_cotisant
        self.utilisateur = utilisateur
        self.auteur = auteur
        self.libelle = libelle
        self.somme = somme
        self.asso = asso

        if asso == "octo":
            self.solde_avant = utilisateur.solde_octo
            self.solde_apres = float(utilisateur.solde_octo) + float(somme)
        else:
            self.solde_avant = utilisateur.solde_biero
            self.solde_apres = float(utilisateur.solde_biero) + float(somme)
    
    def to_dict(self):
        return {
            "date": self.date.isoformat() + "Z" if self.date else None,
            "est_cotisant": self.est_cotisant,
            "libelle": self.libelle,
            "somme": self.somme,
            "asso": self.asso,
            "utilisateur": self.utilisateur.nom_utilisateur,
            "auteur": self.auteur.nom_utilisateur,
            "solde_avant": self.solde_avant,
            "solde_apres": self.solde_apres
        }


class ConsoSoifguard(db.Model):
    """
    nom_conso, asso ('biero' ou 'octo'), prix, prix_cotisant(none si le meme)
    le prix est donne en postif (il sera soustrait au solde lors de l'encaissement)
    """

    __tablename__ = "soifguard_consos"
    id = db.Column(db.Integer, primary_key=True)
    nom_conso = db.Column(db.String(1000), nullable=False)
    asso = db.Column(db.String(10), nullable=False, default="octo")
    prix = db.Column(db.Numeric(10, 2), nullable=False)  # Arrondi à 2 décimales
    prix_cotisant = db.Column(db.Numeric(10, 2), nullable=True)  # Arrondi à 2 décimales

    # prix_cotisant peut etre None si c'est le meme prix
    def __init__(self, nom_conso: str, asso: str = "octo", prix: float = 1, prix_cotisant: float = None):
        self.nom_conso = nom_conso
        if asso == "octo" or asso == "biero":
            self.asso = asso
        else:
            raise ValueError(f"Erreur du champ {asso}. Doit etre 'octo' ou 'biero'")
        self.prix = prix
        self.prix_cotisant = prix_cotisant

    def patch(self, data):
        self.prix = data.get("prix", self.prix)
        self.prix_cotisant = data.get("prix_cotisant", self.prix)
        self.nom = data.get("nom_conso", self.nom_conso)
        db.session.commit()

    def to_dict(self):
        return {"id": self.id, "nom_conso": self.nom_conso, "prix": self.prix, "prix_cotisant": self.prix_cotisant}

