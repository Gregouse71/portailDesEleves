from app import create_app, db
from sqlalchemy.orm.attributes import flag_modified
from app.models import Utilisateur, ElementMedia, Association
from config import Config
import os

"""
Script permettant le transfert de la base de données de l'ancien soifguard
vers le nouveau schéma.
"""

def transfert():
    socketio, app = create_app(Config)

    with app.app_context():
        DIR = "upload/utilisateurs"
        files = os.listdir(DIR)
        # print(files)
        for i, f in enumerate(files):
            if i % 100 == 0:
                print(i)
            user = Utilisateur.query.filter_by(photo=f).all()
            if len(user) == 1:
                # print(user, " : ", f)
                u = user[0]
                media = ElementMedia(u.id, None, f"utilisateurs/{f}")
                db.session.add(media)
                db.session.commit()
                u.photo_id = media.id
            elif len(user) == 2:
                print("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
            else:
                user = Utilisateur.query.filter_by(banniere=f).all()
                if len(user) == 1:
                    u = user[0]
                    media = ElementMedia(u.id, None, f"utilisateurs/{f}")
                    db.session.add(media)
                    db.session.commit()
                    u.banniere_id = media.id

        db.session.commit()

        assos = db.session.query(Association)
        for a in assos:
            if a.logo_path:
                media1 = ElementMedia(None, a.id, os.path.join('associations', a.nom_dossier, a.logo_path))
                db.session.add(media1)
                db.session.commit()
                a.logo_id = media1.id

            if a.banniere_path:
                media2 = ElementMedia(None, a.id, os.path.join('associations', a.nom_dossier, a.banniere_path))
                db.session.add(media2)
                db.session.commit()
                a.banniere_id = media2.id

            # d = a.modules
            # d.append("Media")
            # a.modules = d
            # flag_modified(a, "modules")
            db.session.commit()

if __name__ == "__main__":
    transfert()