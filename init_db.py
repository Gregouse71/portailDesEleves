# init_db.py
from app import create_app, db
from app.models import GlobalVariable
from config import Config

"""
Ce fichier n'est utilise qu'une fois, pour initialiser les bases de donnees
"""

# Creer une instance de l'application Flask
_, app = create_app(Config)

# Créer les tables si elles n'existent pas encore
with app.app_context():
    db.create_all()
    # initilaisation des variables globales

    if GlobalVariable.query.filter_by(key="id_sondage_du_jour").first() is None:
        id_sond_jour = GlobalVariable(key="id_sondage_du_jour", value=None)
        db.session.add(id_sond_jour)
    if GlobalVariable.query.filter_by(key="max_negatif_octo").first() is None:
        max_negatif_octo = GlobalVariable(key="max_negatif_octo", value=None)
        db.session.add(max_negatif_octo)
    if GlobalVariable.query.filter_by(key="max_negatif_biero").first() is None:
        max_negatif_biero = GlobalVariable(key="max_negatif_biero", value=None)
        db.session.add(max_negatif_biero)

    db.session.commit()

print("Les tables ont ete creees avec succes !")
