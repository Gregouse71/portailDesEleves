# fichier pour les petite stables diverses

from app import db


class Permission(db.Model):
    __tablename__ = "permissions_permission"
    id = db.Column(db.Integer, primary_key=True)

    utilisateur_id = db.Column(db.Integer, db.ForeignKey("utilisateurs_utilisateur.id"))
    utilisateur = db.relationship("Utilisateur", back_populates="permissions")

    permission = db.Column(db.String(100))

    def __repr__(self):
        return f"<Permissions {self.id} de l'utilisateur {self.utilisateur_id} : {self.permission}>"

    def __init__(self, utilisateur, permission):
        """
        Crée la permission de valeur permission pour l'utilisateur
        """
        self.permission = permission
        self.utilisateur = utilisateur
        
    def to_dict(self):
        return {
            "id": self.id,
            "permission": self.permission,
            "utilisateur_id": self.utilisateur_id,
            "utilisateur": self.utilisateur.nom_utilisateur
        }
