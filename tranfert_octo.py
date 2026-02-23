import sqlite3
from app import create_app, db
from app.models import Utilisateur
from config import Config

def transfert():
    socketio, app = create_app(Config)

    with app.app_context():
        print("Nom d'utilisateur : solde octo, solde biero")
        old_db_conn = sqlite3.connect('instance/clients.db')
        old_db_cursor = old_db_conn.cursor()

        old_db_cursor.execute("SELECT * FROM clients")
        clients = old_db_cursor.fetchall()

        for c in clients:
            user = Utilisateur.query.filter_by(nom_utilisateur=c[1]).all()
            if len(user) == 0:
                user = Utilisateur.query.filter_by(nom_utilisateur=f"21{c[1][2:]}").all()
            if len(user) == 0:
                user = Utilisateur.query.filter(Utilisateur.nom_utilisateur.ilike(f"%{c[1]}%")).all()
            if len(user) == 0:
                user = Utilisateur.query.filter(Utilisateur.nom_utilisateur.ilike(f"%21{c[1][2:]}%")).all()

            if len(user) > 1:
                print(f"Plusieurs utilisateurs trouvés : {user}")
            elif len(user) == 1:
                user = user[0]
                user.solde_octo = c[6]
                user.solde_biero = c[7]
                print(f"Soldes transférés pour {c[1]} : {c[6]}, {c[7]}")
            else:
                so, sb = c[6], c[7]
                if so != 0 or sb != 0:
                    print(f"{c[1]} : {so}, {sb}")

        db.session.commit()
        old_db_conn.close()


if __name__ == "__main__":
    transfert()