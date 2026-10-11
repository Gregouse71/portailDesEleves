import hashlib
import secrets
from datetime import datetime, timezone, timedelta

from app import db

def _utcnow():
    return datetime.now(timezone.utc)


class CleAPI(db.Model):
    __tablename__ = 'cles_api'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=False)
    utilisateur = db.relationship('Utilisateur', backref=db.backref('cles'))

    nom = db.Column(db.String(100))            # libellé choisi par l'élève ("equipaps prod")
    hash = db.Column(db.String(64), nullable=False, unique=True, index=True)  # sha256 hex
    # Pas utilisée pour l'instant
    portee = db.Column(db.String(256), nullable=False, default='annuaire:read')
    created_at = db.Column(db.DateTime, default=_utcnow)
    last_used_at = db.Column(db.DateTime)
    use_count = db.Column(db.Integer, default=0)
    revoked = db.Column(db.Boolean, default=False)
    expires_on = db.Column(db.DateTime, default=lambda: _utcnow() + timedelta(365))

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "portee": self.portee,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "use_count": self.use_count,
            "revoked": self.revoked,
        }


# Génère une clé "pak_..." : renvoie (valeur_en_clair, sha256_hex).
def generer_cle():
    valeur = "pak_" + secrets.token_urlsafe(32)
    return valeur, hash_cle(valeur)


def hash_cle(valeur):
    return hashlib.sha256(valeur.encode("utf-8")).hexdigest()
