from authlib.integrations.sqla_oauth2 import OAuth2ClientMixin, OAuth2TokenMixin

from app import db


class OAuth2Client(db.Model, OAuth2ClientMixin):
    __tablename__ = 'oauth2_client'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('utilisateurs_utilisateur.id')
    )
    user = db.relationship('utilisateurs_utilisateur')


class OAuth2Token(db.Model, OAuth2TokenMixin):
    __tablename__ = 'oauth2_token'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey('utilisateurs_utilisateur.id')
    )
    user = db.relationship('utilisateurs_utilisateur')