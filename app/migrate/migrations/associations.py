import sqlite3
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
        new_asso = Association(
            nom=row[1],
            description=row[7],
            a_cacher_aux_nouveaux=bool(row[5]),
            ordre_importance=row[4]
        )
        new_asso.id = row[0]
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
                db.session.add(existing_membre)
            else:
                # Create a new entry if it does not exist
                membre = AssociationMembre(
                    utilisateur=utilisateur,
                    mandat=mandat,
                    role=role
                )
                db.session.add(membre)

    db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()
