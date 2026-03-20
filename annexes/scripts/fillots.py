from app import create_app, db
from app.models import Utilisateur
from config import Config

"""
Script permettant le transfert de la base de données de l'ancien soifguard
vers le nouveau schéma.
"""

def transfert():
    socketio, app = create_app(Config)

    with app.app_context():
        users = db.session.query(Utilisateur)
        for u in users:
            if u.marrain_id is not None and not u.marrains:
                marr = db.session.query(Utilisateur).get(u.marrain_id)
                if marr:
                    u.marrains.append(marr)
        db.session.commit()

if __name__ == "__main__":
    transfert()