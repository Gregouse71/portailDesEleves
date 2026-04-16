from flask import Blueprint, request, jsonify, redirect, url_for
from flask_login import current_user
from app import authorization, require_oauth 
import urllib.parse

controllers_oath = Blueprint('controllers_oath', __name__)

@controllers_oath.route('/.well-known/openid-configuration')
def openid_configuration():
    return jsonify({
        "issuer": "https://eleves.rezal-mdm.com/api/oauth",
        "authorization_endpoint": "https://eleves.rezal-mdm.com/api/oauth/authorize",
        "token_endpoint": "https://eleves.rezal-mdm.com/api/oauth/token",
        "userinfo_endpoint": "https://eleves.rezal-mdm.com/api/oauth/userinfo",
        "jwks_uri": "https://eleves.rezal-mdm.com/api/oauth/jwks.json",
        "response_types_supported": ["code"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "scopes_supported": ["openid", "profile", "email"],
        "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post"],
        "claims_supported": ["sub", "name", "email", "preferred_username", "given_name", "family_name"],
        "grant_types_supported": ["authorization_code"]
    })

@controllers_oath.route('/jwks.json')
def jwks():
    from authlib.jose import JsonWebKey
    with open('oauthkey.pem', 'rb') as f:
        # Assign a fixed kid to the key
        key = JsonWebKey.import_key(f.read(), {'kty': 'RSA'})

    key_dict = key.as_dict(is_private=False)
    key_dict.update({
        'kid': 'main-key',
        'use': 'sig',
        'alg': 'RS256'
    })
    
    return jsonify({"keys": [key_dict]})

@controllers_oath.route('/authorize', methods=['GET', 'POST'])
def authorize():
    if not current_user.est_baptise:
        return "Utilisateur non trouvé", 404
    if not current_user.is_authenticated:
        # Properly encode the full path (including its own query string)
        encoded_next = urllib.parse.quote(request.full_path)
        # Redirect to the frontend login page using a relative path to avoid host issues.
        return redirect(f"/login?next={encoded_next}") 
    
    try:
        # Authlib 1.x: Validate the request and get the grant object.
        # This will raise an error if client_id or redirect_uri is invalid.
        grant = authorization.get_consent_grant(end_user=current_user)
        
        # Auto-approve: directly create the authorization response.
        response = authorization.create_authorization_response(grant=grant, grant_user=current_user)
        return response
    except Exception as error:
        import traceback
        traceback.print_exc()
        # Return the error message to help debugging.
        return str(error), 400 



@controllers_oath.route('/token', methods=['POST'])
def issue_token():
    try:
        response = authorization.create_token_response()
        return response
    except Exception as e:
        return str(e), 400

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