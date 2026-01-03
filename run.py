# Permet de run l'application
import eventlet
eventlet.monkey_patch()  #
from app import create_app
from config import Config

socketio, app = create_app(Config)

if __name__ == "__main__":
    socketio.run(app, debug=True)
