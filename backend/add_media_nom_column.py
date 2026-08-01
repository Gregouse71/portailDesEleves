from app import create_app, db
from config import Config
from sqlalchemy import text

def run_migration():
    socketio, app = create_app(Config)
    with app.app_context():
        try:
            print("Adding column 'nom' to 'media_element' table...")
            db.session.execute(text("ALTER TABLE media_element ADD COLUMN nom VARCHAR(255) NULL;"))
            db.session.commit()
            print("Successfully added column 'nom' to 'media_element' table.")
        except Exception as e:
            db.session.rollback()
            print(f"Error (probably column already exists): {e}")

if __name__ == "__main__":
    run_migration()
