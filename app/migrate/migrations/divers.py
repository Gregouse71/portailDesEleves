import sqlite3
from app import db
from app.models.models_divers import Conso

def migrate_divers():
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Migrate inventory_produit to Conso
    old_db_cursor.execute("SELECT * FROM inventory_produit")
    produits = old_db_cursor.fetchall()
    for row in produits:
        asso = 'octo'
        if row[2] == 'Biere':
            asso = 'biero'
        
        new_conso = Conso(
            nom_conso=row[1],
            asso=asso,
            prix=row[5],
            prix_cotisant=row[5]
        )
        new_conso.id = row[0]
        db.session.add(new_conso)

    db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()
