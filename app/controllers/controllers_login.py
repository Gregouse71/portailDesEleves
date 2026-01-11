from flask import Blueprint, request, jsonify
from flask_login import current_user, login_user, logout_user, login_required

from app.models.models_utilisateurs import Utilisateur
from app.services.services_login import send_reset_mail, set_new_password, check_pw

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

@controllers_login.route('reset', methods=['POST'])
def reset_mail():
    data = request.get_json()
    username = data.get('username')
    print(send_reset_mail(username))
    return jsonify({'sent': True}), 200


@controllers_login.route('new', methods=['POST'])
def new_password():
    data = request.get_json()
    token = data.get('token')
    password = data.get('password')
    if set_new_password(token, password):
        return jsonify({'set': True}), 200
    else:
        return jsonify({'set': False}), 403