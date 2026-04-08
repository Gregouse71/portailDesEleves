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
        "claims_supported": ["sub", "name", "email", "preferred_username", "given_name", "family_name"],
        "grant_types_supported": ["authorization_code"]
    })

# 2. Remove /oauth from these routes!
@controllers_oath.route('/authorize', methods=['GET', 'POST'])
def authorize():
    if not current_user.is_authenticated:
        # Redirect to the frontend login page.
        # Ensure that request.url is the full original URL so it can be used for redirecting back.
        return redirect("/login?next=" + request.url) 
    
    try:
        # get_consent_grant handles the validation of the authorization request.
        grant = authorization.get_consent_grant(end_user=current_user)
    except Exception as error:
        return str(error), 400 

    if request.method == 'GET':
        try:
            # Auto-approve for GET requests to simplify the flow for internal usage.
            return authorization.create_authorization_response(grant=grant, grant_user=current_user)
        except Exception as e:
            return str(e), 400
    
    # Handle POST if we ever add a consent form.
    return authorization.create_authorization_response(grant=grant, grant_user=current_user)

@controllers_oath.route('/token', methods=['POST'])
def issue_token():
    return authorization.create_token_response()

@controllers_oath.route('/userinfo')
@require_oauth('openid')
def api_me():
    user = request.oauth_token.user
    scopes = request.oauth_token.scope or ""
    
    user_info = {
        "sub": str(user.id),
    }
    
    if 'profile' in scopes:
        user_info.update({
            "name": f"{user.prenom} {user.nom}", 
            "preferred_username": user.nom_utilisateur,
            "given_name": user.prenom,
            "family_name": user.nom,
        })
    
    if 'email' in scopes:
        user_info.update({
            "email": user.email,
            "email_verified": True
        })
        
    return jsonify(user_info)