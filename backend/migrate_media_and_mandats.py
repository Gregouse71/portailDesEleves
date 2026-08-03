from app import create_app, db
from config import Config
from sqlalchemy import text

def run_migration():
    socketio, app = create_app(Config)
    with app.app_context():
        # 1. Add logo_id to associations_mandat
        try:
            print("Adding column 'logo_id' to 'associations_mandat' table...")
            db.session.execute(text("ALTER TABLE associations_mandat ADD COLUMN logo_id INTEGER NULL;"))
            db.session.commit()
            print("Successfully added column 'logo_id'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

        # 2. Add banniere_id to associations_mandat
        try:
            print("Adding column 'banniere_id' to 'associations_mandat' table...")
            db.session.execute(text("ALTER TABLE associations_mandat ADD COLUMN banniere_id INTEGER NULL;"))
            db.session.commit()
            print("Successfully added column 'banniere_id'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

        # 3. Add nom to media_element
        try:
            print("Adding column 'nom' to 'media_element' table...")
            db.session.execute(text("ALTER TABLE media_element ADD COLUMN nom VARCHAR(255) NULL;"))
            db.session.commit()
            print("Successfully added column 'nom' to 'media_element'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

        # 4. Add mandat_id to media_element
        try:
            print("Adding column 'mandat_id' to 'media_element' table...")
            db.session.execute(text("ALTER TABLE media_element ADD COLUMN mandat_id INTEGER NULL REFERENCES associations_mandat(id);"))
            db.session.commit()
            print("Successfully added column 'mandat_id'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

        # --- DATA MIGRATION STEP ---
        try:
            print("Migrating data: linking media to current mandats...")
            # 1. Re-link existing association media to the currently active mandat
            db.session.execute(text("""
                UPDATE media_element
                SET mandat_id = (
                    SELECT id FROM associations_mandat 
                    WHERE associations_mandat.association_id = media_element.association_id 
                    AND actuel = 1
                )
                WHERE association_id IS NOT NULL;
            """))
            
            print("Migrating data: copying logo and banniere to current mandats...")
            # 2. Copy the logo and banner IDs to the currently active mandat
            db.session.execute(text("""
                UPDATE associations_mandat
                SET 
                    logo_id = (SELECT logo_id FROM associations_association WHERE associations_association.id = associations_mandat.association_id),
                    banniere_id = (SELECT banniere_id FROM associations_association WHERE associations_association.id = associations_mandat.association_id)
                WHERE actuel = 1;
            """))
            db.session.commit()
            print("Successfully migrated data.")
        except Exception as e:
            db.session.rollback()
            print(f"Error migrating data: {e}")
        # -------------------------------

        # 5. Remove association_id from media_element (and its foreign key)
        try:
            print("Looking for foreign key on 'association_id'...")
            result = db.session.execute(text("""
                SELECT CONSTRAINT_NAME 
                FROM information_schema.KEY_COLUMN_USAGE 
                WHERE TABLE_NAME = 'media_element' 
                AND COLUMN_NAME = 'association_id' 
                AND CONSTRAINT_SCHEMA = DATABASE();
            """))
            fk_name = result.scalar()
            if fk_name:
                print(f"Dropping foreign key `{fk_name}`...")
                db.session.execute(text(f"ALTER TABLE media_element DROP FOREIGN KEY `{fk_name}`;"))
                db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Could not drop foreign key (safe to ignore if using SQLite or already dropped): {e}")


if __name__ == "__main__":
    run_migration()
