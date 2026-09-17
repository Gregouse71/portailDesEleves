# init_db.py
from app import create_app, db
from app.models import GlobalVariable
from config import Config

"""
Ce fichier est utilisé pour créer la base de données au départ,
puis pour ajouter des tables lors du développement.
"""

# Creer une instance de l'application Flask
_, app = create_app(Config)

# Créer les tables si elles n'existent pas encore
with app.app_context():
    db.create_all()
    # initilaisation des variables globales

    gloabl_vars = [
        "id_sondage_du_jour",
        "mode_parrainage_actif",
        "max_negatif_octo",
        "max_negatif_biero"
    ]

    for key in gloabl_vars:
        if GlobalVariable.query.filter_by(key=key).first() is None:
            db.session.add(GlobalVariable(key=key, value=None))


    db.session.commit()

print("Les tables ont ete creees avec succes !")
