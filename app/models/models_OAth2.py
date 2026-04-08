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


class AuthorizationCodeGrant(grants.AuthorizationCodeGrant):
    def save_authorization_code(self, code, request):
        auth_code = OAuth2AuthorizationCode(
            code=code,
            client_id=request.client.client_id,
            redirect_uri=request.payload.redirect_uri,
            scope=request.payload.scope,
            user_id=request.user.id,
        )
        db.session.add(auth_code)
        db.session.commit()
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
        return {
            'key': grant.client.client_secret,
            'alg': 'HS256',
            'iss': 'https://eleves.rezal-mdm.com/api/oauth',
            'exp': 3600
        }

    def generate_user_info(self, user, scope):
        user_info = UserInfo(sub=str(user.id), name=user.nom_utilisateur)
        if 'email' in scope:
            user_info['email'] = user.email
            user_info['email_verified'] = True
        if 'profile' in scope:
            user_info['preferred_username'] = user.prenom
            user_info['given_name'] = user.prenom
            user_info['family_name'] = user.nom
        return user_info