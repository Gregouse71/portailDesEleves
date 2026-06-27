from gevent import monkey; monkey.patch_all()

"""
Ce fichier crée et initialise l'application et les extensions. Il charge la configuration
et enregistre les blueprints. 

Il est execute pour initialiser l'application. 
"""

from flask import Flask, send_from_directory
from flask_cors import CORS # permet d'accepter les requetes provenant de n'importe quelle origine
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler
from werkzeug.middleware.proxy_fix import ProxyFix
from authlib.integrations.flask_oauth2 import AuthorizationServer, ResourceProtector
from authlib.integrations.sqla_oauth2 import create_query_client_func, create_save_token_func

import os
os.environ['AUTHLIB_INSECURE_TRANSPORT'] = '1'

from config import Config


# Initialisation des extensions (sans encore les attacher à l'application)
limiter = Limiter(get_remote_address)
socketio = SocketIO(
    async_mode='gevent',
    cors_allowed_origins="*",
    message_queue=Config.REDIS_URL
)
db = SQLAlchemy()
login_manager = LoginManager()
# session = Session()
scheduler = APScheduler()
authorization = AuthorizationServer()
require_oauth = ResourceProtector()


def create_app(config: Config):
    # Creation de l'instance de l'application Flask
    app = Flask(__name__)
    # Chargement de la configuration
    app.config.from_object(config)

    # Active CORS pour toutes les routes de l'application
    CORS(app, origins="*", supports_credentials=True, expose_headers=["Content-Disposition"])


    # Initialisation des extensions avec l'application
    if not app.config.get("TESTING"):
        limiter.init_app(app)
    db.init_app(app)
    login_manager.init_app(app)
    socketio.init_app(app)
    scheduler.init_app(app)
    # session.init_app(app)
    # Trust more proxy headers for better URL detection (proto, host, etc.)
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1, x_prefix=1)

    from .models import Utilisateur  # Importer la classe Utilisateur

    # Definir la fonction user_loader
    @login_manager.user_loader
    def load_user(user_id):
        return Utilisateur.query.get(int(user_id))  # Charger l'utilisateur par ID

    # Importer et enregistrer le blueprint global API
    from app.controllers import api
    app.register_blueprint(api, url_prefix='/api')
    
    #permet d'avoir accès au fichier upload 
    #ne pas supprimer
    UPLOAD_FOLDER = os.path.join(os.getcwd(), Config.UPLOAD_BASE_FOLDER)
    @app.route('/upload/<path:filename>')
    def serve_file(filename):
        return send_from_directory(UPLOAD_FOLDER, filename)

    from app.models import OAuth2Client, OAuth2Token, AuthorizationCodeGrant, OpenIDCode
    from authlib.oauth2.rfc7636 import CodeChallenge
    from authlib.oauth2.rfc6750 import BearerTokenValidator

    class MyBearerTokenValidator(BearerTokenValidator):
        def authenticate_token(self, token_string):
            return OAuth2Token.query.filter_by(access_token=token_string).first()
    require_oauth.register_token_validator(MyBearerTokenValidator())

    # OAth2 setup
    query_client = create_query_client_func(db.session, OAuth2Client)
    save_token = create_save_token_func(db.session, OAuth2Token)
    authorization.init_app(app, query_client=query_client, save_token=save_token)
    authorization.register_grant(AuthorizationCodeGrant, [OpenIDCode(require_nonce=False), CodeChallenge(required=False)])

    from .tasks import tasks
    if not scheduler.running:
        socketio.start_background_task(scheduler.start)
    return socketio, app
