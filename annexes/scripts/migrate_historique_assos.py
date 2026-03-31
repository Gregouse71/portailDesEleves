import sqlite3
from app import create_app, db
from app.models.models_associations import Association, AssociationMandat, AssociationMembre
from app.models.models_utilisateurs import Utilisateur
from config import Config

def migrate_historique_assos():
    socketio, app = create_app(Config)

    with app.app_context():
        try:
            old_db_conn = sqlite3.connect('instance/old_database.db')
            old_db_cursor = old_db_conn.cursor()
        except sqlite3.Error as e:
            print(f"Erreur lors de la connexion à l'ancienne base de données : {e}")
            return

        print("Récupération de la table de correspondance des profils...")
        old_db_cursor.execute("SELECT id, user_id FROM trombi_userprofile")
        profile_to_user = {row[0]: row[1] for row in old_db_cursor.fetchall()}

        print("Vérification et création des mandats 'Anciens membres'...")
        all_assos = Association.query.all()
        for asso in all_assos:
            # On vérifie si le mandat existe déjà via SQLAlchemy
            mandat_ancien = AssociationMandat.query.filter_by(association_id=asso.id, nom='Anciens membres').first()
            if not mandat_ancien:
                print(f"Création du mandat 'Anciens membres' pour l'asso: {asso.nom}")
                new_mandat = AssociationMandat(asso=asso, nom='Anciens membres', actuel=False, position=-1)
                db.session.add(new_mandat)
        
        db.session.commit()

        # On recharge la map des mandats après commit pour avoir les IDs corrects
        anciens_mandats = AssociationMandat.query.filter_by(nom='Anciens membres').all()
        anciens_mandat_map = {m.association_id: m.id for m in anciens_mandats}
        
        print(f"Map des mandats chargée : {len(anciens_mandat_map)} entrées.")

        print("Récupération de l'historique...")
        old_db_cursor.execute("SELECT association_id, user_profile_id, role, date_debut, date_fin FROM trombi_historique_assoc")
        historique_entries = old_db_cursor.fetchall()
        
        count_added = 0
        count_skipped = 0
        
        for asso_id, profile_id, role, date_debut, date_fin in historique_entries:
            user_id = profile_to_user.get(profile_id)
            mandat_id = anciens_mandat_map.get(asso_id)
            
            if not user_id or not mandat_id:
                count_skipped += 1
                continue
                
            # Vérifier si l'utilisateur et le mandat existent (sécurité supplémentaire)
            user = db.session.get(Utilisateur, user_id)
            mandat = db.session.get(AssociationMandat, mandat_id)
            
            if not user or not mandat:
                count_skipped += 1
                continue

            # Vérifier si le membre existe déjà
            exists = AssociationMembre.query.filter_by(utilisateur_id=user_id, mandat_id=mandat_id).first()
            
            if not exists:
                full_role = role if role else ""
                if date_debut or date_fin:
                    period = f" ({date_debut or '?'} - {date_fin or '?'})"
                    full_role += period
                
                try:
                    new_membre = AssociationMembre(utilisateur=user, mandat=mandat, role=full_role[:1000], position=0)
                    db.session.add(new_membre)
                    count_added += 1
                    
                    if count_added % 200 == 0:
                        db.session.commit()
                        print(f"Progression : {count_added} membres ajoutés...", end='\r')
                except Exception as e:
                    print(f"\nErreur lors de l'ajout (user {user_id}, mandat {mandat_id}) : {e}")
                    db.session.rollback()
                    count_skipped += 1
            else:
                count_skipped += 1

        db.session.commit()
        old_db_conn.close()
        print(f"\nTerminé. Ajoutés : {count_added}, Ignorés : {count_skipped}")

if __name__ == '__main__':
    migrate_historique_assos()
