import sqlite3
import unicodedata
import os
from werkzeug.security import generate_password_hash
from datetime import datetime
from sqlalchemy import text

from app import db
from app.models.models_utilisateurs import Utilisateur

def update_user_photos():
    print("Updating user photos...")
    users = Utilisateur.query.all()
    for user in users:
        photo_filename_jpg = f"{user.nom_utilisateur.lower()}.jpg"
        photo_path_jpg = os.path.join('upload', 'utilisateurs', photo_filename_jpg)

        photo_filename_png = f"{user.nom_utilisateur.lower()}.png"
        photo_path_png = os.path.join('upload', 'utilisateurs', photo_filename_png)

        if os.path.exists(photo_path_jpg):
            user.photo = photo_filename_jpg
        elif os.path.exists(photo_path_png):
            user.photo = photo_filename_png
        else:
            user.photo = None
    db.session.commit()
    print("User photos updated.")


def migrate_users():
    print("Migrating users...")
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    def format_promotion(promo):
        if promo is None:
            return None
        promo_str = str(promo)
        if promo_str.isdigit() and len(promo_str) == 1:
            return f"0{promo_str}"
        return promo_str

    # Fetch all users from the old database
    old_db_cursor.execute("SELECT * FROM auth_user")
    auth_users = old_db_cursor.fetchall()
    print(f"Found {len(auth_users)} users in old database.")

    # Fetch all user profiles from the old database
    old_db_cursor.execute("SELECT * FROM trombi_userprofile")
    trombi_userprofiles = old_db_cursor.fetchall()
    print(f"Found {len(trombi_userprofiles)} user profiles in old database.")

    # Fetch instruments from old database
    old_db_cursor.execute("SELECT bm.eleve_id, bi.nom, bm.niveau FROM bda_maitrise bm JOIN bda_instrument bi ON bm.instrument_id = bi.id")
    bda_maitrise_data = old_db_cursor.fetchall()
    instruments_by_user = {}
    for eleve_id, instrument_nom, niveau in bda_maitrise_data:
        if eleve_id not in instruments_by_user:
            instruments_by_user[eleve_id] = []
        instruments_by_user[eleve_id].append({"name": instrument_nom, "niveau": niveau})

    # Fetch questions and responses from old database
    old_db_cursor.execute("SELECT tur.userprofile_id, tq.enonce, tr.contenu FROM trombi_userprofile_reponses tur JOIN trombi_reponse tr ON tur.reponse_id = tr.id JOIN trombi_question tq ON tr.question_id = tq.id")
    trombi_qa_data = old_db_cursor.fetchall()
    questions_reponses_by_user = {}
    
    question_mapping = {
        "Ta devise ?": "010Ta devise ?",
        "Tes hobbies ?": "020Tes hobbies ?",
        "Quelles assoces comptes-tu faire ?": "030Quelles assoces comptes-tu faire ?",
        "Tes sports ?": "040Tes sports ?",
        "Raconte une blague :": "050Raconte une blague :",
        "Trash ton co :": "060Trash ton co :",
        "Et ton parrain, comment tu l'aimes ?": "070Et ton parrain, comment tu l'aimes ?",
        "Et ton fillot ?": "080Et ton fillot ?",
        "Champagne ou Ricard ?": "090Champagne ou Ricard ?",
        "Ton top 5 du moment ?": "100Ton top 5 du moment :",
    }

    for userprofile_id, question_enonce, reponse_contenu in trombi_qa_data:
        if userprofile_id not in questions_reponses_by_user:
            questions_reponses_by_user[userprofile_id] = {}
        
        new_question_enonce = question_mapping.get(question_enonce)
        if new_question_enonce:
            questions_reponses_by_user[userprofile_id][new_question_enonce] = reponse_contenu

    # Fetch parrain-fillot relationships
    old_db_cursor.execute("SELECT from_userprofile_id, to_userprofile_id FROM trombi_userprofile_parrains")
    parrain_fillot_relationships = old_db_cursor.fetchall()


    # Create a dictionary to map user_id to user profile
    user_profiles = {profile[1]: profile for profile in trombi_userprofiles}
    db.session.execute(text("PRAGMA foreign_keys = OFF;"))

    def capitalize_name(name_raw):
        if not name_raw:
            return "Inconnu"
        
        name_raw = ''.join([i for i in name_raw if not i.isdigit()])
        lowercase_particles = {"de", "du", "la", "le", "des", "van", "von", "d", "l"}
        words = unicodedata.normalize('NFC', name_raw).split()
        capitalized_words = []
        for word in words:
            if word.lower() in lowercase_particles:
                capitalized_words.append(word.lower())
            else:
                capitalized_words.append(word.capitalize())
        return ' '.join(capitalized_words)

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
            
            prenom = capitalize_name(prenom_raw)
            nom = capitalize_name(nom_raw)

            email = auth_user[4] if auth_user[4] else f"{auth_user[1]}@placeholder.com"

            if (prenom == "Inconnu" or nom == "Inconnu") and "@" in email:
                try:
                    email_prefix = email.split('@')[0]
                    if '.' in email_prefix:
                        prenom_from_email, nom_from_email = email_prefix.split('.')
                        prenom = capitalize_name(prenom_from_email.replace('_', ' '))
                        nom = capitalize_name(nom_from_email.replace('_', ' '))
                except:
                    pass

            new_user = Utilisateur(
                nom_utilisateur=auth_user[1].lower(),
                prenom=prenom,
                nom=nom,
                promotion=format_promotion(profile[6]),
                email=email,
                cycle=cycle,
                mot_de_passe_en_clair="password",
            )

            # Set other attributes
            new_user.id = auth_user[0]
            new_user.mot_de_passe = auth_user[5] # Already hashed
            new_user.est_superutilisateur = bool(auth_user[8])
            
            # The photo is set by update_user_photos() after the migration

            try:
                new_user.date_de_naissance = datetime.strptime(profile[5], '%Y-%m-%d').date() if profile[5] else None
            except ValueError:
                new_user.date_de_naissance = None
            new_user.surnom = profile[19]
            new_user.ville_origine = profile[32]
            new_user.telephone = profile[4]
            new_user.chambre = profile[13]
            new_user.sports = profile[15]

            new_user.est_baptise = est_baptise
            new_user.meilleur_score_2048 = profile[31]
            new_user.solde_octo = profile[20]
            new_user.solde_biero = profile[21]
            new_user.instruments = instruments_by_user.get(user_id, [])
            new_user.questions_reponses_du_portail = questions_reponses_by_user.get(user_id, {})
            
            # Add the new user to the new database
            db.session.add(new_user)
            db.session.commit()
        else:
            print(f"No profile found for user {auth_user[1]}")

    # Now establish co relationships
    print("Establishing co relationships...")
    old_db_cursor.execute("SELECT from_userprofile_id, to_userprofile_id FROM trombi_userprofile_co")
    co_relationships = old_db_cursor.fetchall()
    for from_user_id, to_user_id in co_relationships:
        user = Utilisateur.query.get(from_user_id)
        co = Utilisateur.query.get(to_user_id)
        if user and co:
            if co not in user.cos:
                user.cos.append(co)
            if user not in co.cos:
                co.cos.append(user)
    db.session.commit()

    # Commit the changes for all users
    db.session.execute(text("PRAGMA foreign_keys = ON;"))

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
    update_user_photos() # Call the new function to update user photos
