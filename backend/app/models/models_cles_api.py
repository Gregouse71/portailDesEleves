import hashlib
import secrets
from datetime import datetime, timezone, timedelta

from app import db

def _utcnow():
    return datetime.now(timezone.utc)


def _utc(dt):
    """La base rend les dates sans fuseau : elles sont en UTC."""
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


class CleAPI(db.Model):
    __tablename__ = 'cles_api'

    id = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=False)
    utilisateur = db.relationship('Utilisateur', backref=db.backref('cles'))

    nom = db.Column(db.String(100), nullable=False)            # libellé choisi par l'élève ("equipaps prod")
    hash = db.Column(db.String(64), nullable=False, unique=True, index=True)  # sha256 hex
    # Pas utilisée pour l'instant
    portee = db.Column(db.String(256), nullable=False, default='annuaire:read')
    created_at = db.Column(db.DateTime, nullable=False, default=_utcnow)
    last_used_at = db.Column(db.DateTime)
    use_count = db.Column(db.Integer, nullable=False, default=0)
    revoked = db.Column(db.Boolean, nullable=False, default=False)
    expires_on = db.Column(db.DateTime, nullable=False, default=lambda: _utcnow() + timedelta(365))

    # Valeur en clair : connue à la création seulement, jamais stockée
    valeur = None

    def __init__(self, utilisateur, nom):
        """Crée une clé "pak_..." pour l'utilisateur. La valeur en clair reste dans self.valeur, le temps
        de la montrer une fois : seule son empreinte est stockée."""
        if not isinstance(nom, str) or not 1 <= len(nom.strip()) <= 100:
            raise ValueError("La clé doit avoir un nom de 1 à 100 caractères.")
        self.utilisateur = utilisateur
        self.nom = nom.strip()
        self.valeur = "pak_" + secrets.token_urlsafe(32)
        self.hash = hash_cle(self.valeur)

    def est_active(self):
        """Une clé sert tant qu'elle n'est ni révoquée ni expirée. Seule règle de validité d'une clé :
        utiliser_cle, /creer et to_dict la lisent."""
        return not self.revoked and _utc(self.expires_on) > _utcnow()

    def to_dict(self):
        return {
            "id": self.id,
            "nom": self.nom,
            "portee": self.portee,
            "created_at": self.created_at.isoformat(),
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "use_count": self.use_count,
            "revoked": self.revoked,
            "expires_on": self.expires_on.isoformat(),
            "active": self.est_active(),
        }


def hash_cle(valeur):
    return hashlib.sha256(valeur.encode("utf-8")).hexdigest()
