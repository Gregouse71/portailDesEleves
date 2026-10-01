from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app import db
from app.services.services_login import has_permission
from app.models.models_cles_api import CleAPI, generer_cle
from app.services.services_cles_api import revoquer_cle

# Gestion des clés API personnelles (session portail). La brique annuaire elle-même
# vit dans controllers_annuaire (auth par X-API-Key, pas par session).
controllers_cles = Blueprint('controllers_cles', __name__)

MAX_CLES_ACTIVES = 3


@controllers_cles.get('/liste')
@login_required
def lister_cles_api():
    """Renvoie la liste des clés d'api de l'utilisateur"""
    cles = CleAPI.query.filter_by(utilisateur_id=current_user.id).order_by(CleAPI.revoked.asc(), CleAPI.created_at.desc()).all()
    return jsonify({
        "cles": [c.to_dict() for c in cles],
        "eligible": has_permission(current_user, "cle_api"),
    }), 200


@controllers_cles.post('/creer')
@login_required
def creer_cle_api():
    """Crée une clé d'api pour l'utilisateur l'utilisateur"""
    if not has_permission(current_user, "cle_api"):
        return jsonify({"message": "Les clés API sont disponibles à partir de la 2A."}), 403
    actives = CleAPI.query.filter_by(utilisateur_id=current_user.id, revoked=False).count()
    if actives >= MAX_CLES_ACTIVES:
        return jsonify({"message": f"Tu as déjà {MAX_CLES_ACTIVES} clés actives. Révoque-en une d'abord."}), 400

    data = request.get_json() or {}
    nom = (data.get("nom") or "").strip()[:100] or "Sans nom"
    valeur, empreinte = generer_cle()
    cle = CleAPI(utilisateur_id=current_user.id, nom=nom, hash=empreinte)
    db.session.add(cle)
    db.session.commit()
    # La valeur en clair n'est affichée QUE cette fois-ci.
    return jsonify({"cle": cle.to_dict(), "valeur": valeur}), 201


@controllers_cles.post('/revoquer')
@login_required
def revoquer_cle_api():
    """Révoque la clé d'api de l'utilisateur"""
    data = request.json
    id = data.get("id")
    valeur = data.get("valeur")

    cle = revoquer_cle(id, valeur, current_user.id)

    if cle is None:
        return jsonify({"message": "Clé introuvable."}), 404

    return jsonify({"cle": cle.to_dict()}), 200
