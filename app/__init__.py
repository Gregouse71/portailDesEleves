import eventlet
eventlet.monkey_patch()

"""
Ce fichier crée et initialise l'application et les extensions. Il charge la configuration
et enregistre les blueprints. 

Il est execute pour initialiser l'application. 

"""
from flask import Flask, send_from_directory
from flask_cors import CORS # permet d'accepter les requetes provenant de n'importe quelle origine
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler

# from flask_session import Session
from config import Config
import os

socketio = SocketIO(
    async_mode='eventlet',
    cors_allowed_origins="*",
    message_queue="redis://localhost:6379/0",
    logger=True,
    engineio_logger=True
)

# Initialisation des extensions (sans encore les attacher à l'application)
db = SQLAlchemy()
login_manager = LoginManager()
# session = Session()
scheduler = APScheduler()

def create_app():
    # Creation de l'instance de l'application Flask
    app = Flask(__name__)
    # Chargement de la configuration
    app.config.from_object(Config)

    # Active CORS pour toutes les routes de l'application
    CORS(app, origins="*", supports_credentials=True)

    
    # Initialisation des extensions avec l'application
    db.init_app(app)
    login_manager.init_app(app)
    socketio.init_app(app)
    scheduler.init_app(app)
    # session.init_app(app)

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
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'app', 'upload')
    @app.route('/upload/<path:filename>')
    def serve_file(filename):
        return send_from_directory(UPLOAD_FOLDER, filename)
    
    from .tasks import tasks
    socketio.start_background_task(scheduler.start)
    return socketio, app
