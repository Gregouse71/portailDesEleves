from flask import Blueprint, jsonify

# Importer tous les blueprints des differents controllers
from app.controllers.controllers_utilisateurs import controllers_utilisateurs
from app.controllers.controllers_sondages import controllers_sondages
from app.controllers.controllers_associations import controllers_associations
from app.controllers.controllers_global import controllers_global
from app.controllers.controllers_soifguard import controllers_soifguard
from app.controllers.modules.controllers_bibliotheque import controllers_bibliotheque
from app.controllers.controllers_evenements import controllers_evenements
from app.controllers.controllers_publications import controllers_publications
from app.controllers.controllers_login import controllers_login
from app.controllers.controllers_chat import controllers_chat
from app.controllers.modules.controllers_elections import controllers_elections
from app.controllers.controllers_jeux import controller_jeux
from app.controllers.modules.controllers_audio import controllers_audio
from app.controllers.modules.controllers_cotisations import controllers_cotisations
from app.controllers.controllers_oauth import controllers_oauth
from app.controllers.controllers_echecs import controllers_echecs

# Creer un blueprint global qui regroupe tous les autres
api = Blueprint('api', __name__)
@api.get('/alive')
def is_alive_route():
    return jsonify(True)

# Enregistrer chaque blueprint sous le blueprint global
api.register_blueprint(controllers_utilisateurs, url_prefix='/users')
api.register_blueprint(controllers_sondages, url_prefix='/sondages')
api.register_blueprint(controllers_associations, url_prefix='/associations')
api.register_blueprint(controllers_global, url_prefix='/global')
api.register_blueprint(controllers_soifguard, url_prefix='/soifguard')
api.register_blueprint(controllers_bibliotheque, url_prefix="/bibliotheque")
api.register_blueprint(controllers_evenements, url_prefix='/evenements')
api.register_blueprint(controllers_publications, url_prefix='/publications')
api.register_blueprint(controllers_login, url_prefix='/login')
api.register_blueprint(controllers_chat, url_prefix='/chat')
api.register_blueprint(controllers_elections, url_prefix='/elections')
api.register_blueprint(controller_jeux, url_prefix='/jeux')
api.register_blueprint(controllers_audio, url_prefix='/audio')
api.register_blueprint(controllers_cotisations, url_prefix='/cotisations')
api.register_blueprint(controllers_oauth, url_prefix='/oauth')
api.register_blueprint(controllers_echecs, url_prefix='/echecs')

# Ainsi, toutes les routes seront accessibles sous `/api/users` et `/api/sondages`, etc.
from . import socket_chat
from . import socket_echecs
