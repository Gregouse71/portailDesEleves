import sqlite3
from app import db
from app.models.models_publications import Publication
from app.models.models_associations import Association
from app.models.models_utilisateurs import Utilisateur
from datetime import datetime

def migrate_publications():
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Get BDE association and admin user
    bde_asso = Association.query.filter_by(nom="BDE").first()
    admin_user = Utilisateur.query.get(1)

    # Migrate association_news
    old_db_cursor.execute("SELECT * FROM association_news")
    news = old_db_cursor.fetchall()
    for row in news:
        asso = Association.query.get(row[5])
        auteur = Utilisateur.query.get(row[6])
        if asso and auteur:
            new_pub = Publication(
                association=asso,
                auteur=auteur,
                titre=row[1],
                contenu=row[3],
                date_publication=datetime.strptime(row[2], '%Y-%m-%d %H:%M:%S.%f').strftime('%Y%m%d%H%M'),
                is_commentable=True,
                a_cacher_aux_nouveaux=bool(row[4])
            )
            new_pub.id = row[0]
            db.session.add(new_pub)
            print(f"Migrated association news {row[0]}")

    # Migrate vendome_vendome
    if bde_asso and admin_user:
        old_db_cursor.execute("SELECT * FROM vendome_vendome")
        vendomes = old_db_cursor.fetchall()
        for row in vendomes:
            new_pub = Publication(
                association=bde_asso,
                auteur=admin_user,
                titre=row[1],
                contenu="",
                date_publication=datetime.strptime(row[3], '%Y-%m-%d').strftime('%Y%m%d%H%M'),
                is_commentable=True,
                a_cacher_aux_nouveaux=bool(row[5]),
                tags=["Vendôme"]
            )
            db.session.add(new_pub)
            print(f"Migrated vendome {row[0]}")

    # Migrate bde_palum
    if bde_asso and admin_user:
        old_db_cursor.execute("SELECT * FROM bde_palum")
        palums = old_db_cursor.fetchall()
        for row in palums:
            new_pub = Publication(
                association=bde_asso,
                auteur=admin_user,
                titre=f"Palum {row[3]}",
                contenu="",
                date_publication=datetime.fromtimestamp(row[2]).strftime('%Y%m%d%H%M'),
                is_commentable=True,
                a_cacher_aux_nouveaux=False,
                tags=["Palum"]
            )
            db.session.add(new_pub)
            print(f"Migrated palum {row[0]}")

    db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()
