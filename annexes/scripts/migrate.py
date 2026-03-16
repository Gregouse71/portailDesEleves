from app import create_app, db
from app.migrate.migrate_all import migrate_all
from app.models.models_utilisateurs import Utilisateur
from config import Config

"""
Script utilisé pour lancer la migration des données de l'ancienne base de données
vers le nouveau format.
"""

socketio, app = create_app(Config)

with app.app_context():
    db.create_all()
    migrate_all()

    # Create admin user if it does not exist
    if not Utilisateur.query.filter_by(nom_utilisateur="admin").first():
        admin_user = Utilisateur(
            nom_utilisateur="admin",
            prenom="Admin",
            nom="Admin",
            promotion="00",
            email="admin@example.com",
            cycle="de",
            mot_de_passe_en_clair="P1ch4"
        )
        admin_user.est_superutilisateur = True
        db.session.add(admin_user)
        db.session.commit()
