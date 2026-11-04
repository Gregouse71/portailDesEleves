from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app import db
from app.services.services_login import has_permission
from app.models.models_cles_api import CleAPI
from app.services.services_cles_api import revoquer_cle
from app.utils.decorators import superutilisateur_required

# Gestion des clés API personnelles (session portail). Les routes qui acceptent
# une clé (X-API-Key) sont marquées @cle_api_autorisee, comme /api/users/annuaire.
controllers_cles = Blueprint('controllers_cles', __name__)

MAX_CLES_ACTIVES = 3


@controllers_cles.get('/liste')
@login_required
def lister_cles_api():
    """Renvoie la liste des clés d'api de l'utilisateur"""
    cles = CleAPI.query.filter_by(utilisateur_id=current_user.id).order_by(CleAPI.revoked.asc(), CleAPI.created_at.desc()).all()
    return jsonify({
        "cles": [c.to_dict() for c in cles],
        "eligible_api": has_permission(current_user, "cle_api"),
    }), 200


@controllers_cles.post('/creer')
@login_required
def creer_cle_api():
    """Crée une clé d'api pour l'utilisateur l'utilisateur"""
    if not has_permission(current_user, "cle_api"):
        return jsonify({"message": "Les clés API sont disponibles à partir de la 2A."}), 403
    # Une clé expirée ne marche plus : elle ne compte pas parmi les clés actives
    if sum(cle.est_active() for cle in current_user.cles) >= MAX_CLES_ACTIVES:
        return jsonify({"message": f"Tu as déjà {MAX_CLES_ACTIVES} clés actives. Révoque-en une d'abord."}), 400

    data = request.get_json()
    try:
        cle = CleAPI(current_user, data.get("nom"))
    except ValueError as e:
        return jsonify({"message": str(e)}), 400
    db.session.add(cle)
    db.session.commit()
    # La valeur en clair n'est affichée QUE cette fois-ci.
    return jsonify({"cle": cle.to_dict(), "valeur": cle.valeur}), 201


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


@controllers_cles.get('/revoquer_tout')
@login_required
@superutilisateur_required
def revoquer_cle_utilisateur():
    """Révoque toutes les clés d'api de l'utilisateur"""
    user_id = request.args.get("id")
    if user_id is None:
        return jsonify({"message": "Aucun ID d'utilisateur reçu"}), 400

    actives = CleAPI.query.filter_by(utilisateur_id=user_id, revoked=False).all()
    for cle in actives:
        cle.revoked = True
    db.session.commit()

    return jsonify({"message": "Clés supprimées avec succès"}), 200