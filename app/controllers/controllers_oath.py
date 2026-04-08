from flask import Blueprint, request, jsonify, redirect, url_for
from flask_login import current_user
from app import authorization, require_oauth 

controllers_oath = Blueprint('controllers_oath', __name__)

@controllers_oath.route('/.well-known/openid-configuration')
def openid_configuration():
    return jsonify({
        "issuer": "https://eleves.rezal-mdm.com/api/oauth",
        "authorization_endpoint": "https://eleves.rezal-mdm.com/api/oauth/authorize",
        "token_endpoint": "https://eleves.rezal-mdm.com/api/oauth/token",
        "userinfo_endpoint": "https://eleves.rezal-mdm.com/api/oauth/userinfo",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["HS256"],
        "scopes_supported": ["openid", "profile", "email"],
        "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
        "claims_supported": ["sub", "name", "email", "preferred_username"]
    })

# 2. Remove /oauth from these routes!
@controllers_oath.route('/authorize', methods=['GET', 'POST'])
def authorize():
    if not current_user.is_authenticated:
        return redirect(url_for('login', next=request.url)) 
    
    try:
        grant = authorization.get_consent_grant(end_user=current_user)
    except Exception as error:
        return str(error), 400 

    if request.method == 'GET':
        try:
            return authorization.create_authorization_response(grant=grant, grant_user=current_user)
        except Exception as e:
            return str(e), 400

@controllers_oath.route('/token', methods=['POST'])
def issue_token():
    return authorization.create_token_response()

@controllers_oath.route('/userinfo')
@require_oauth('profile email openid')
def api_me():
    user = request.oauth_token.user

    return jsonify({
        "sub": str(user.id),
        "name": user.nom_utilisateur, 
        "preferred_username": user.prenom,
        "email": user.email,
        "email_verified": True
    })