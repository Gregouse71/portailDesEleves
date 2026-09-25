from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app import db
from app.models.models_cles_api import CleAPI, generer_cle
from app.services.services_cles_api import est_2a_et_plus

# Gestion des clés API personnelles (session portail). La brique annuaire elle-même
# vit dans controllers_annuaire (auth par X-API-Key, pas par session).
controllers_cles = Blueprint('controllers_cles', __name__)

MAX_CLES_ACTIVES = 3


@controllers_cles.route('/liste', methods=['GET'])
@login_required
def liste():
    cles = CleAPI.query.filter_by(user_id=current_user.id).order_by(CleAPI.created_at.desc()).all()
    return jsonify({
        "cles": [c.to_dict() for c in cles],
        "eligible": est_2a_et_plus(current_user),
    }), 200


@controllers_cles.route('/creer', methods=['POST'])
@login_required
def creer():
    if not est_2a_et_plus(current_user):
        return jsonify({"message": "Les clés API sont disponibles à partir de la 2A."}), 403
    actives = CleAPI.query.filter_by(user_id=current_user.id, revoked=False).count()
    if actives >= MAX_CLES_ACTIVES:
        return jsonify({"message": f"Tu as déjà {MAX_CLES_ACTIVES} clés actives. Révoque-en une d'abord."}), 400
    data = request.get_json() or {}
    nom = (data.get("nom") or "").strip()[:100] or "Sans nom"
    valeur, empreinte = generer_cle()
    cle = CleAPI(user_id=current_user.id, nom=nom, hash=empreinte)
    db.session.add(cle)
    db.session.commit()
    # La valeur en clair n'est affichée QUE cette fois-ci.
    return jsonify({"cle": cle.to_dict(), "valeur": valeur}), 201


@controllers_cles.route('/revoquer/<int:cle_id>', methods=['POST'])
@login_required
def revoquer(cle_id):
    cle = CleAPI.query.filter_by(id=cle_id, user_id=current_user.id).first()
    if not cle:
        return jsonify({"message": "Clé introuvable."}), 404
    cle.revoked = True
    db.session.commit()
    return jsonify({"cle": cle.to_dict()}), 200
