import sqlite3
import os
import shutil
from app import db
from app.models.models_associations import Association, AssociationMandat, AssociationMembre
from app.models.models_utilisateurs import Utilisateur

def migrate_associations():
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Migrate association_association
    old_db_cursor.execute("SELECT * FROM association_association")
    associations = old_db_cursor.fetchall()
    for row in associations:
        nom_asso = row[1]
        if nom_asso == "Vendōme":
            nom_asso = "Vendôme"
        
        new_asso = Association(
            nom=nom_asso,
            description=row[7].replace('\\r\\n', '\n').strip() if row[7] else None,
            a_cacher_aux_nouveaux=bool(row[5]),
            ordre_importance=row[4]
        )
        new_asso.id = row[0]
        db.session.add(new_asso)

        # Migrate icon
        old_icon_path_rel = row[6]
        if old_icon_path_rel:
            old_icon_path_rel = old_icon_path_rel.strip().lstrip('/')
            old_icon_path_full = os.path.join('upload', 'old_media', old_icon_path_rel)
            
            if os.path.exists(old_icon_path_full):
                filename = os.path.basename(old_icon_path_full)
                new_folder = os.path.join('upload', 'associations', new_asso.nom_dossier)
                new_icon_path_full = os.path.join(new_folder, filename)
                
                shutil.copy2(old_icon_path_full, new_icon_path_full)
                
                new_asso.logo_path = filename
                db.session.add(new_asso)

    # Migrate bde_liste
    old_db_cursor.execute("SELECT * FROM bde_liste")
    bde_listes = old_db_cursor.fetchall()
    for row in bde_listes:
        new_asso = Association(
            nom=row[1],
            description="",
            a_cacher_aux_nouveaux=False,
            ordre_importance=1,
            type_association='club BDE'
        )
        db.session.add(new_asso)

    # Migrate bds_listebds
    old_db_cursor.execute("SELECT * FROM bds_listebds")
    bds_listes = old_db_cursor.fetchall()
    for row in bds_listes:
        new_asso = Association(
            nom=row[1],
            description="",
            a_cacher_aux_nouveaux=False,
            ordre_importance=1,
            type_association='club BDS'
        )
        db.session.add(new_asso)

    db.session.commit()

    # Create a default "Membres" mandate for each association
    all_assos = Association.query.all()
    mandat_map = {}
    for asso in all_assos:
        mandat = AssociationMandat(asso=asso, nom="P24", actuel=True)
        db.session.add(mandat)
        mandat_map[asso.id] = mandat
    
    # Flush to assign IDs to new mandates
    db.session.flush()

    # Migrate association_adhesion
    old_db_cursor.execute("SELECT * FROM association_adhesion")
    adhesions = old_db_cursor.fetchall()
    for row in adhesions:
        asso_id = row[2]
        user_id = row[1]
        role = row[3]
        ordre = row[4]

        utilisateur = Utilisateur.query.get(user_id)
        
        if asso_id in mandat_map and utilisateur:
            mandat = mandat_map[asso_id]
            
            # Check if an AssociationMembre with this utilisateur_id and mandat_id already exists
            existing_membre = AssociationMembre.query.filter_by(
                utilisateur_id=utilisateur.id,
                mandat_id=mandat.id
            ).first()

            if existing_membre:
                # Update the role if the entry already exists
                existing_membre.role = role
                existing_membre.position = ordre
                db.session.add(existing_membre)
            else:
                # Create a new entry if it does not exist
                membre = AssociationMembre(
                    utilisateur=utilisateur,
                    mandat=mandat,
                    role=role,
                    position=ordre
                )
                db.session.add(membre)

    db.session.commit()

    # Migrate Vendome files
    print("Starting Vendome file migration...")

    # Create vendome association folder
    vendome_upload_path = os.path.join('upload', 'associations', 'vendôme')
    if not os.path.exists(vendome_upload_path):
        os.makedirs(vendome_upload_path)
    print(f"Created/Ensured vendome upload directory: {vendome_upload_path}")

    # Copy files from old_media/vendome
    old_vendome_path = os.path.join('upload', 'old_media', 'vendome')
    if os.path.exists(old_vendome_path):
        print(f"Copying files from {old_vendome_path} to {vendome_upload_path}...")
        for item in os.listdir(old_vendome_path):
            s = os.path.join(old_vendome_path, item)
            d = os.path.join(vendome_upload_path, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
                print(f"  Copied directory: {item}")
            else:
                shutil.copy2(s, d)
                print(f"  Copied file: {item}")
    else:
        print(f"Source directory {old_vendome_path} does not exist. Skipping.")

    # Copy files from old_media/vendome2
    old_vendome2_path = os.path.join('upload', 'old_media', 'vendome2')
    if os.path.exists(old_vendome2_path):
        print(f"Copying files from {old_vendome2_path} to {vendome_upload_path}...")
        for item in os.listdir(old_vendome2_path):
            s = os.path.join(old_vendome2_path, item)
            d = os.path.join(vendome_upload_path, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
                print(f"  Copied directory: {item}")
            else:
                shutil.copy2(s, d)
                print(f"  Copied file: {item}")
    else:
        print(f"Source directory {old_vendome2_path} does not exist. Skipping.")

    print("Vendome file migration finished.")

    # Migrate Palum files
    print("Starting Palum file migration...")
    bde_upload_path = os.path.join('upload', 'associations', 'bde')
    if not os.path.exists(bde_upload_path):
        os.makedirs(bde_upload_path)
    print(f"Created/Ensured bde upload directory: {bde_upload_path}")

    old_palum_path = os.path.join('upload', 'old_media', 'palum')
    if os.path.exists(old_palum_path):
        print(f"Copying files from {old_palum_path} to {bde_upload_path}...")
        for item in os.listdir(old_palum_path):
            s = os.path.join(old_palum_path, item)
            d = os.path.join(bde_upload_path, item)
            if os.path.isdir(s):
                shutil.copytree(s, d, dirs_exist_ok=True)
                print(f"  Copied directory: {item}")
            else:
                shutil.copy2(s, d)
                print(f"  Copied file: {item}")
    else:
        print(f"Source directory {old_palum_path} does not exist. Skipping.")
    print("Palum file migration finished.")

    # Close the connection to the old database
    old_db_conn.close()
