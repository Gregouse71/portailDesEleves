from datetime import datetime, timezone

from app.extensions import db
from app.models.models_cles_api import CleAPI, hash_cle
from app.services.services_login import has_permission

def utiliser_cle(valeur):
    """Renvoie l'utilisateur correspondant à la clé, et enregistre l'utilisation"""
    if not valeur:
        return None
    cle_api = CleAPI.query.filter_by(hash=hash_cle(valeur), revoked=False).first()
    if cle_api is not None and cle_api.expires_on > datetime.now(tz=None):
        cle_api.use_count = cle_api.use_count + 1
        cle_api.last_used_at = datetime.now(tz=timezone.utc)
        db.session.commit()
        if has_permission(cle_api.utilisateur, "cle_api"):
            return cle_api.utilisateur


def revoquer_cle(id, valeur, user_id):
    if id is not None:
        cle = CleAPI.query.filter_by(id=id, utilisateur_id=user_id).first()
    else:
        cle = CleAPI.query.filter_by(hash=hash_cle(valeur), utilisateur_id=user_id).first()

    if cle is not None:
        cle.revoked = True
        db.session.commit()

    return cle