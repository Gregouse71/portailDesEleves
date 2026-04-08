from authlib.integrations.sqla_oauth2 import OAuth2ClientMixin, OAuth2TokenMixin, OAuth2AuthorizationCodeMixin
from authlib.oauth2.rfc6749 import grants
from authlib.oidc.core import UserInfo
from authlib.oidc.core.grants import OpenIDCode as _OpenIDCode
from app import db


class OAuth2Client(db.Model, OAuth2ClientMixin):
    __tablename__ = 'oauth2_client'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('utilisateurs_utilisateur.id')
    )
    user = db.relationship('Utilisateur')


class OAuth2Token(db.Model, OAuth2TokenMixin):
    __tablename__ = 'oauth2_token'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('utilisateurs_utilisateur.id')
    )
    user = db.relationship('Utilisateur')


class OAuth2AuthorizationCode(db.Model, OAuth2AuthorizationCodeMixin):
    __tablename__ = 'oauth2_code'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('utilisateurs_utilisateur.id')
    )
    user = db.relationship('Utilisateur')
    nonce = db.Column(db.String(200))

    def get_nonce(self):
        return self.nonce


class AuthorizationCodeGrant(grants.AuthorizationCodeGrant):
    def save_authorization_code(self, code, request):
        print(f"DEBUG: Saving authorization code for client {request.client.client_id}")
        # Authlib 1.x uses request.payload.data or request.data depending on the state
        nonce = request.payload.data.get('nonce') or request.payload.data.get('nonce')
        auth_code = OAuth2AuthorizationCode(
            code=code,
            client_id=request.client.client_id,
            redirect_uri=request.payload.redirect_uri,
            scope=request.payload.scope,
            user_id=request.user.id,
            nonce=nonce,
        )
        db.session.add(auth_code)
        db.session.commit()
        print(f"DEBUG: Authorization code saved with nonce: {nonce}")
        return auth_code

    def query_authorization_code(self, code, client):
        return OAuth2AuthorizationCode.query.filter_by(
            code=code, client_id=client.client_id).first()

    def delete_authorization_code(self, authorization_code):
        db.session.delete(authorization_code)
        db.session.commit()

    def authenticate_user(self, authorization_code):
        return authorization_code.user

class OpenIDCode(_OpenIDCode):
    def exists_nonce(self, nonce, request):
        return False

    def get_jwt_config(self, grant):
        with open('oauthkey.pem', 'rb') as f:
            key = f.read()
        return {
            'key': key,
            'alg': 'RS256',
            'iss': 'https://eleves.rezal-mdm.com/api/oauth',
            'kid': 'main-key'
        }

    def generate_user_info(self, user, scope):
        user_info = UserInfo(
            sub=str(user.id), 
            name=f"{user.prenom} {user.nom}",
            preferred_username=user.nom_utilisateur
        )
        if 'email' in scope:
            user_info['email'] = user.email
            user_info['email_verified'] = True
        if 'profile' in scope:
            user_info['given_name'] = user.prenom
            user_info['family_name'] = user.nom
        return user_info

    def generate_id_token(self, token, user, scope, request):
        nonce = None
        if hasattr(request, 'grant') and hasattr(request.grant, 'authorization_code'):
            nonce = request.grant.authorization_code.get_nonce()
        
        # OIDC clients like MediaWiki often expect these claims in the id_token itself
        # to decide whether to allow login or create an account.
        user_info = self.generate_user_info(user, scope)
        
        return super().generate_id_token(
            token, user, scope, request, 
            nonce=nonce,
            **user_info
        )