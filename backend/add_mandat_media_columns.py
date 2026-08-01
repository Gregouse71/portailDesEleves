from app import create_app, db
from config import Config
from sqlalchemy import text

def run_migration():
    socketio, app = create_app(Config)
    with app.app_context():
        try:
            print("Adding column 'logo_id' to 'associations_mandat' table...")
            db.session.execute(text("ALTER TABLE associations_mandat ADD COLUMN logo_id INTEGER NULL;"))
            db.session.commit()
            print("Successfully added column 'logo_id'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

        try:
            print("Adding column 'banniere_id' to 'associations_mandat' table...")
            db.session.execute(text("ALTER TABLE associations_mandat ADD COLUMN banniere_id INTEGER NULL;"))
            db.session.commit()
            print("Successfully added column 'banniere_id'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

        try:
            print("Adding column 'mandat_id' to 'media_element' table...")
            db.session.execute(text("ALTER TABLE media_element ADD COLUMN mandat_id INTEGER NULL REFERENCES associations_mandat(id);"))
            db.session.commit()
            print("Successfully added column 'mandat_id'.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

if __name__ == "__main__":
    run_migration()
