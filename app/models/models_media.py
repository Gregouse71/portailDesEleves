from app import db


class ElementMedia(db.Model):
    """
    Classe représentnt un media mis en ligne par un utilisateur/asso
    """
    __tablename__ = 'media_element'
    id = db.Column(db.Integer, primary_key=True)

    # A priori seul utilisateur _ou bien_ assocition est non nul
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=True)
    utilisateur = db.relationship('Utilisateur', back_populates='media')
    association_id = db.Column(db.Integer, db.ForeignKey('associations_association.id'), nullable=True)
    association = db.relationship('Association', back_populates='media')

    file_path = db.Column(db.String(1000), nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)
    cache = db.Column(db.Boolean, nullable=False, default=False)
    protege = db.Column(db.Boolean, nullable=False, default=False)

    def __init__(self, utilisateur_id: int, association_id: int, file_path: str, cache: bool=False, protege=False) :
        """
        Cree un nouveau sondage
        """
        if utilisateur_id is None and association_id is None:
            raise ValueError("Le media doit être associé à un utilisateur ou une association")
        self.utilisateur_id = utilisateur_id
        self.association_id = association_id
        self.file_path = file_path
        self.position = 0
        self.cache = cache
        self.protege = protege

    def to_dict(self):
        return {
            "id": self.id,
            "file_path": self.file_path,
            "position": self.position,
            "utilisateur_id": self.utilisateur_id,
            "association_id": self.association_id
        }
