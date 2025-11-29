import sqlite3
import unicodedata
from app import db
from app.models.models_utilisateurs import Utilisateur
from werkzeug.security import generate_password_hash
from datetime import datetime

def migrate_users():
    print("Migrating users...")
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Fetch all users from the old database
    old_db_cursor.execute("SELECT * FROM auth_user")
    auth_users = old_db_cursor.fetchall()
    print(f"Found {len(auth_users)} users in old database.")

    # Fetch all user profiles from the old database
    old_db_cursor.execute("SELECT * FROM trombi_userprofile")
    trombi_userprofiles = old_db_cursor.fetchall()
    print(f"Found {len(trombi_userprofiles)} user profiles in old database.")

    # Fetch instruments from old database
    old_db_cursor.execute("SELECT bm.eleve_id, bi.nom FROM bda_maitrise bm JOIN bda_instrument bi ON bm.instrument_id = bi.id")
    bda_maitrise_data = old_db_cursor.fetchall()
    instruments_by_user = {}
    for eleve_id, instrument_nom in bda_maitrise_data:
        if eleve_id not in instruments_by_user:
            instruments_by_user[eleve_id] = []
        instruments_by_user[eleve_id].append(instrument_nom)

    # Fetch questions and responses from old database
    old_db_cursor.execute("SELECT tur.userprofile_id, tq.enonce, tr.contenu FROM trombi_userprofile_reponses tur JOIN trombi_reponse tr ON tur.reponse_id = tr.id JOIN trombi_question tq ON tr.question_id = tq.id")
    trombi_qa_data = old_db_cursor.fetchall()
    questions_reponses_by_user = {}
    for userprofile_id, question_enonce, reponse_contenu in trombi_qa_data:
        if userprofile_id not in questions_reponses_by_user:
            questions_reponses_by_user[userprofile_id] = {}
        questions_reponses_by_user[userprofile_id][question_enonce] = reponse_contenu

    # Fetch parrain-fillot relationships
    old_db_cursor.execute("SELECT from_userprofile_id, to_userprofile_id FROM trombi_userprofile_parrains")
    parrain_fillot_relationships = old_db_cursor.fetchall()


    # Create a dictionary to map user_id to user profile
    user_profiles = {profile[1]: profile for profile in trombi_userprofiles}

    for auth_user in auth_users:
        user_id = auth_user[0]
        profile = user_profiles.get(user_id)

        if profile:
            print(f"Migrating user {auth_user[1]}")
            # Determine cycle
            cycle = 'ic'
            if profile[10]:  # est_ast
                cycle = 'ast'
            elif profile[11]:  # est_isupfere
                cycle = 'isup'
            elif profile[12]: # est_cesurien
                cycle = 'vs'
            
            # Determine if baptized
            est_baptise = False
            if profile[17]: # parrain_id
                est_baptise = True

            # Create a new user object
            prenom_raw = auth_user[2] if auth_user[2] else ""
            prenom_raw = prenom_raw.replace('_', ' ')
            try:
                prenom_raw = prenom_raw.encode('latin-1').decode('utf-8')
            except (UnicodeEncodeError, UnicodeDecodeError):
                pass

            nom_raw = auth_user[3] if auth_user[3] else ""
            nom_raw = nom_raw.replace('_', ' ')
            try:
                nom_raw = nom_raw.encode('latin-1').decode('utf-8')
            except (UnicodeEncodeError, UnicodeDecodeError):
                pass

            new_user = Utilisateur(
                nom_utilisateur=auth_user[1].lower(),
                prenom=' '.join(word.capitalize() for word in unicodedata.normalize('NFC', prenom_raw).split()) if prenom_raw else "Inconnu",
                nom=' '.join(word.capitalize() for word in unicodedata.normalize('NFC', nom_raw).split()) if nom_raw else "Inconnu",
                promotion=str(profile[6]) if profile[6] else None,
                email=auth_user[4] if auth_user[4] else f"{auth_user[1]}@placeholder.com",
                cycle=cycle,
                mot_de_passe_en_clair="password",
            )

            # Set other attributes
            new_user.id = auth_user[0]
            new_user.mot_de_passe = auth_user[5] # Already hashed
            new_user.est_superutilisateur = bool(auth_user[8])
            new_user.photo = profile[39] # image_url
            try:
                new_user.date_de_naissance = datetime.strptime(profile[5], '%Y-%m-%d').date() if profile[5] else None
            except ValueError:
                new_user.date_de_naissance = None
            new_user.surnom = profile[19]
            new_user.ville_origine = profile[32]
            new_user.telephone = profile[4]
            new_user.chambre = profile[13]
            new_user.sports = profile[15]

            new_user.co_id = profile[16]
            new_user.est_baptise = est_baptise
            new_user.meilleur_score_2048 = profile[31]
            new_user.solde_octo = profile[20]
            new_user.solde_biero = profile[21]
            new_user.instruments = instruments_by_user.get(user_id, [])
            new_user.questions_reponses_du_portail = questions_reponses_by_user.get(user_id, {})
            
            # TODO: Consider other unmapped fields from trombi_userprofile if necessary:
            # - option (varchar(128))
            # - a_la_meuh (INTEGER)
            # - est_une_fille (INTEGER)
            # - adresse_ailleurs (varchar(512))
            # - solde_minesmarket (float)
            # - solde_freshbox (float)
            # - solde_mineshake (float)
            # - solde_bda (float)
            # - solde_paindemine (float)
            # - victoires_sondages (INTEGER)
            # - participations_sondages (INTEGER)
            # - score_victoires_sondages (float)
            # - score_defaites_sondages (float)
            # - centre (varchar(100))
            # - date_debut_stage (date)
            # - date_fin_stage (date)
            # - latitude (double)
            # - longitude (double)
            # - ville (varchar(500))
            # - token (varchar(512))

            # Add the new user to the new database
            db.session.add(new_user)
        else:
            print(f"No profile found for user {auth_user[1]}")

    # Commit the changes for all users
    db.session.commit()

    # Now establish parrain-fillot relationships
    # print("Establishing parrain-fillot relationships...")
    # for parrain_id, fillot_id in parrain_fillot_relationships:
    #     parrain = Utilisateur.query.get(parrain_id)
    #     fillot = Utilisateur.query.get(fillot_id)

    #     if parrain and fillot:
    #         if fillot.marrain != parrain: # Check if relationship already exists
    #             fillot.marrain = parrain
    #     else:
    #         print(f"Warning: Could not find parrain (ID: {parrain_id}) or fillot (ID: {fillot_id}) for relationship.")
    
    # db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()
    print("Users migration finished.")
