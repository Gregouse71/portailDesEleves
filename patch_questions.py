import sqlite3
from app import create_app, db
from app.models.models_utilisateurs import Utilisateur, default_questions
from config import Config

def patch_questions():
    # Initialize the app to connect to the main database (MariaDB)
    app_socketio, app = create_app(Config)

    with app.app_context():
        print("Patching user questions...")
        
        # Connect to the old database (SQLite source)
        old_db_conn = sqlite3.connect('instance/old_database.db')
        old_db_cursor = old_db_conn.cursor()

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
            "Et ton parrain, comment tu l’aimes ?": "070Et ton parrain, comment tu l'aimes ?",
            "Et ton fillot ?": "080Et ton fillot ?",
            "Champagne ou Ricard ?": "090Champagne ou Ricard ?",
            "Ton top 5 du moment ?": "100Ton top 5 du moment :",
            "Que signifie JPG ?": "110Que signifie JPG ?",
            "Qui convoites-tu secrètement ?": "120Qui convoites-tu secrètement ?",
            "Le truc le plus absurde qui te soit jamais arrivé :": "130Le truc le plus absurde qui te soit jamais arrivé :",
            "Tes vacances de rêve ?": "140Tes vacances de rêve ?",
            "Ton date idéal ?": "150Ton date idéal ?",
            "Ton talent caché ?": "160Ton talent caché ?",
        }

        # Group responses by user ID
        for userprofile_id, question_enonce, reponse_contenu in trombi_qa_data:
            if userprofile_id not in questions_reponses_by_user:
                questions_reponses_by_user[userprofile_id] = {}
            
            new_question_enonce = question_mapping.get(question_enonce)
            if new_question_enonce:
                questions_reponses_by_user[userprofile_id][new_question_enonce] = reponse_contenu

        # Fetch the mapping between old userprofile_id and user_id (which corresponds to Utilisateur.id)
        old_db_cursor.execute("SELECT id, user_id FROM trombi_userprofile")
        profile_to_user_mapping = dict(old_db_cursor.fetchall())

        # Update users in the new database (MariaDB)
        users = Utilisateur.query.all()
        updated_count = 0
        
        for user in users:
            # Step 1: Initialize with defaults (all empty)
            # We use copy() to ensure each user gets a fresh dictionary
            final_responses = default_questions.copy()

            # Find the userprofile_id corresponding to this user.id
            user_profile_id = None
            for pid, uid in profile_to_user_mapping.items():
                if uid == user.id:
                    user_profile_id = pid
                    break
            
            # Step 2: Overlay answers from old DB if available
            if user_profile_id and user_profile_id in questions_reponses_by_user:
                old_db_responses = questions_reponses_by_user[user_profile_id]
                final_responses.update(old_db_responses)
            
            # Update the user record
            user.questions_reponses_du_portail = final_responses
            updated_count += 1

        db.session.commit()
        old_db_conn.close()
        print(f"Patched questions for {updated_count} users.")

if __name__ == '__main__':
    patch_questions()