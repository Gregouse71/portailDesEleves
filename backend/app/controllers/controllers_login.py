from flask import Blueprint, request, jsonify, abort
from flask_login import current_user, login_user, logout_user, login_required

from app.models.models_utilisateurs import Utilisateur
from app.models.models_divers import Permission
from app.services.services_login import send_reset_mail, set_new_password, check_pw, get_permissions, has_permission
from app.utils.decorators import superutilisateur_required
from app import db, limiter

controllers_login = Blueprint('controllers_login', __name__)

@controllers_login.route('/est_auth', methods=['GET'])
def est_auth():
    return jsonify({"etat_connexion": current_user.is_authenticated}), 200

@controllers_login.route('/current_user_id', methods=['GET'])
@login_required
def get_current_user_id():
    # Because @login_required is used, we know the user is authenticated here
    return jsonify({"id_utilisateur": current_user.id}), 200

@controllers_login.route('/connexion', methods=['POST'])
@limiter.limit("10/minute")
def connexion():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    utilisateur = Utilisateur.query.filter_by(nom_utilisateur=username).first()
    
    if utilisateur and check_pw(utilisateur, password):
        login_user(utilisateur, remember=True)
        return jsonify({"connecte": True}), 200
    
    return jsonify({"connecte": False, "error": "Identifiants invalides"}), 401

@controllers_login.route('/deconnexion', methods=['POST'])
@login_required
def deconnexion():
    logout_user()
    return jsonify({'connecte': False}), 200

@controllers_login.route('/reset', methods=['POST'])
def reset_mail():
    data = request.get_json()
    username = data.get('username')
    send_reset_mail(username)
    return jsonify({'sent': True}), 200


@controllers_login.route('/new', methods=['POST'])
def new_password():
    data = request.get_json()
    token = data.get('token')
    password = data.get('password')
    if not password:
        abort(400)
    if set_new_password(token, password):
        return jsonify({'set': True}), 200
    else:
        return jsonify({'set': False}), 403


@controllers_login.get("/verifier_permission/<string:perm>/<int:user_id>")
@login_required
def verifier_permission(perm: str, user_id: int):
    """
    Verifie si l'utilisateur a la permission demandée
    """
    if user_id != current_user.id and not current_user.est_superutilisateur:
        abort(403)

    if perm is None or user_id is None:
        return jsonify({"success": False, "message": "Nom de premission ou user id invalide"}), 400

    user = Utilisateur.query.get(user_id)
    if has_permission(user, perm) or current_user.est_superutilisateur:
        return jsonify(True), 200
    return jsonify(False), 200

@controllers_login.get("/permissions")
@superutilisateur_required
def get_get_permissions():
    """
    Renvoie la liste des utilisateurs avec leurs permissions, avec pagination.
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    pseudo = request.args.get('pseudo', "", type=str)
    identite = request.args.get('identite', "", type=str)
    email = request.args.get('email', "", type=str)
    promo = request.args.get('promo', "", type=str)
    cycle = request.args.get('cycle', "", type=str)
    permission = request.args.get('permission', "", type=str)
    est_baptise = request.args.get('est_baptise', "", type=str)
    
    return jsonify(get_permissions(page, per_page, pseudo, identite, email, promo, cycle, permission, est_baptise)), 200

@controllers_login.delete("/permissions/<int:id>")
@superutilisateur_required
def delete_permission (id):
    """
    Supprime la permission
    """
    perm = Permission.query.get(id)
    d = perm.to_dict()
    db.session.delete(perm)
    db.session.commit()
    return jsonify(d)

@controllers_login.post('/permissions')
@superutilisateur_required
def update_permissions():
    """
    Met à jour les permissions d'un utilisateur.
    """
    data = request.get_json()
    user_id = data.get('user_id')
    permission = data.get('permission')

    if not user_id or permission is None:
        return jsonify({"message": "user_id et permissions requis"}), 400
    user = Utilisateur.query.get(user_id)

    if not user:
        return jsonify({"message": "L'utilisateur n'existe pas"}), 400

    try:
        perm = Permission(user, permission)
        db.session.add(perm)
        db.session.commit()
        return jsonify(perm.to_dict()), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 404

@controllers_login.post('/baptiser_tous')
@superutilisateur_required
def baptiser_tout_le_monde():
    users = db.session.query(Utilisateur).filter_by(est_baptise=False)
    for u in users:
        u.est_baptise = True
    db.session.commit()
    return jsonify({"message": "Utilisateurs baptisés"}), 200