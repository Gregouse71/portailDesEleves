from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_required
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler
from flasgger import Swagger
from authlib.integrations.flask_oauth2 import AuthorizationServer, ResourceProtector

from yaml import safe_load
import os

from config import Config

# Initialisation des extensions (sans encore les attacher à l'application)

# Gestionnaire de la base de données
db = SQLAlchemy()
# Gestionnaire des connexions des utilisateurs
login_manager = LoginManager()
# Limiteur de requetes, pour éviter de se faire spammer
limiter = Limiter(get_remote_address)
# Gestionnaire des tâches périodiques
scheduler = APScheduler()

# Permet de gérer les websocket, pour le chat, les échecs...
socketio = SocketIO(
    async_mode='gevent' if os.name != 'nt' else None,
    cors_allowed_origins="*",
    message_queue=Config.REDIS_URL
)

# Documentation dynamique de l'api
swagger = Swagger(
    config={
        "url_prefix": "/api",
        "specs_route": "/apidocs/",
        "uiversion": 3,
    },
    template = safe_load("""
openapi: 3.0.2
swagger:
info:
  title: "API du Portail des élèves"
  version: "1.1"
  description: "Routes bien documentées pour récupérer des informations directement dans la base de données du portail des élèves"
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-KEY
      description: "Colle ta clé d'API ici"
security:
  - ApiKeyAuth: []
"""),
    decorators=[login_required],
    merge=True
)

# Utilitaires pour OAuth
authorization = AuthorizationServer()
require_oauth = ResourceProtector()
