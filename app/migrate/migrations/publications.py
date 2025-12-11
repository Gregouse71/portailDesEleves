import sqlite3
from app import db
from app.models.models_publications import Publication
from app.models.models_associations import Association
from app.models.models_utilisateurs import Utilisateur
from datetime import datetime, date

def process_date(date_value, default_date, formats):
    # Case 1: It is already a datetime object -> Return as is
    if isinstance(date_value, datetime):
        return date_value

    # Case 2: It is a date object (e.g., from a SQL DATE column) -> Convert to datetime (midnight)
    if isinstance(date_value, date):
        return datetime.combine(date_value, datetime.min.time())

    # Case 3: It is a string (or convertible to string) -> Try parsing
    if date_value:
        date_str = str(date_value).strip()  # Strip whitespace just in case
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except (ValueError, TypeError):
                continue
    
    # Case 4: Value is None or parsing failed -> Return default
    return default_date

def migrate_publications():
    print("STARTING PUBLICATIONS MIGRATION")

    # Get BDE association and admin user
    bde_asso = Association.query.filter_by(nom="BDE").first()
    admin_user = Utilisateur.query.get(1)

    # Get or create Vendôme association
    vendome_asso = Association.query.filter_by(nom="Vendôme").first()
    if not vendome_asso:
        vendome_asso = Association(
            nom="Vendôme",
            description="L'association des Vendômes",
            a_cacher_aux_nouveaux=False,
            ordre_importance=1,
            type_association='normale'
        )
        db.session.add(vendome_asso)
        db.session.commit()
        print("Created Vendôme association.")

    # Define default date
    default_date = datetime(2025, 1, 1)

    # Migrate association_news
    try:
        old_db_conn = sqlite3.connect('instance/old_database.db')
        old_db_cursor = old_db_conn.cursor()
        old_db_cursor.execute("SELECT * FROM association_news")
        news = old_db_cursor.fetchall()
        news_date_formats = ['%Y-%m-%d %H:%M:%S.%f', '%Y-%m-%d %H:%M:%S']
        for row in news:
            asso = Association.query.get(row[5])
            auteur = Utilisateur.query.get(row[6])
            if asso and auteur:
                date_pub = process_date(row[2], default_date, news_date_formats)
                new_pub = Publication(
                    association=asso,
                    auteur=auteur,
                    titre=row[1],
                    contenu=row[3].replace('\\r\\n', '\n'),
                    date_publication=date_pub.strftime('%Y-%m-%d %H:%M:%S.%f'),
                    is_commentable=True,
                    a_cacher_aux_nouveaux=bool(row[4])
                )
                new_pub.id = row[0]
                db.session.add(new_pub)
        old_db_conn.close()
    except Exception as e:
        print(f"Error migrating association_news: {e}")


    # Migrate vendome_vendome
    if vendome_asso and admin_user:
        try:
            old_db_conn = sqlite3.connect('instance/old_database.db')
            old_db_cursor = old_db_conn.cursor()
            old_db_cursor.execute("SELECT * FROM vendome_vendome")
            vendomes = old_db_cursor.fetchall()
            print(f"Fetched {len(vendomes)} vendomes from old database.")
            vendome_date_formats = ['%Y-%m-%d']
            
            for row in vendomes:
                # row structure: (id, titre, fichier, date, thumbnail, is_hidden)
                date_pub = process_date(row[3], default_date, vendome_date_formats)
                
                # CLEAN PATHS: Remove 'vendome/' prefix to match new folder structure
                fichier_clean = row[2].replace('vendome/', '') if row[2] else None
                
                # --- NEW: Handle Thumbnail ---
                # Based on your DB, the thumbnail is at index 4
                thumbnail_clean = row[4].replace('vendome/', '') if row[4] else None

                new_pub = Publication(
                    association=vendome_asso,
                    auteur=admin_user,
                    titre=row[1],
                    contenu="",
                    date_publication=date_pub.strftime('%Y-%m-%d %H:%M:%S.%f'),
                    is_commentable=True,
                    a_cacher_aux_nouveaux=bool(row[5]),
                    fichier_joint=fichier_clean,
                    miniature=thumbnail_clean, # Pass the cleaned thumbnail path here
                    tags=["Vendôme"]
                )
                db.session.add(new_pub)
                
            old_db_conn.close()
        except Exception as e:
            print(f"Error migrating vendomes: {e}")

    # Migrate bde_palum
    if bde_asso and admin_user:
        try:
            old_db_conn = sqlite3.connect('instance/old_database.db')
            old_db_cursor = old_db_conn.cursor()
            old_db_cursor.execute("SELECT * FROM bde_palum")
            palums = old_db_cursor.fetchall()
            news_date_formats = ['%Y']
            print(f"Fetched {len(palums)} palums from old database.")
            for row in palums:
                date_pub = process_date(row[2], default_date, news_date_formats)

                thumbnail_clean = row[4].replace('palum/', '') if row[4] else None
                
                new_pub = Publication(
                    association=bde_asso,
                    auteur=admin_user,
                    titre=f"Palum {row[3]}",
                    contenu="",
                    date_publication=date_pub.strftime('%Y-%m-%d %H:%M:%S.%f'),
                    is_commentable=True,
                    a_cacher_aux_nouveaux=False,
                    miniature=thumbnail_clean,
                    fichier_joint=row[1].replace('palum/', '') if row[1] else None,
                    tags=["Palum"]
                )
                db.session.add(new_pub)
            old_db_conn.close()
        except Exception as e:
            print(f"Error migrating palums: {e}")

    db.session.commit()

    print("FINISHED PUBLICATIONS MIGRATION")