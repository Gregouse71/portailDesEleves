# Permet de run l'application
from app import create_app
from config import Config

socketio, app = create_app(Config)

import os
if __name__ == "__main__":
    socketio.run(app, debug=Config.DEBUG)
