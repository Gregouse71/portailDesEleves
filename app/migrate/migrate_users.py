from app import create_app
from app.models.models_utilisateurs import Utilisateur

from app.migrate import db_session, Base, metadata
from app import db

socketio, app = create_app()

def migrate_users():
    with app.app_context():
        print(list(metadata.tables.keys()))
        users_auth = db_session.query(Base.classes.auth_user).all()
        users_infos = db_session.query(Base.classes.trombi_userprofile).all()
        for user_a in users_auth[:10]:
            user_i = next(u for u in users_infos if user_a.id == u.user_id)
            print(user_a.username)
            print(user_i.first_name)
            u = Utilisateur(user_a.username, user_i.first_name, user_i.last_name, str(user_i.promo), user_a.email, "ic", "1234")#, user_i.birthday)
            u.est_superutilisateur = False
            u.est_baptise = False
            db.session.add(u)
        db.session.commit()