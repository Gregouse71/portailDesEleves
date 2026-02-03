import eventlet
eventlet.monkey_patch()
from app import create_app, db
from sqlalchemy import text
import json
from config import Config

def migrate():
    """
    Refactors the Association model by:
    1. Adding a 'modules' column (as TEXT for SQLite compatibility).
    2. Populating it based on the 'tab_election' column.
    3. The 'tab_election' column is NOT dropped automatically.
    """
    _socketio, app = create_app(Config)
    with app.app_context():
        print("Starting migration...")

        # Use a single transaction
        with db.engine.connect() as connection:
            trans = connection.begin()
            try:
                # 1. Add the 'modules' column
                try:
                    connection.execute(text('ALTER TABLE associations_association ADD COLUMN modules TEXT;'))
                    print("Column 'modules' added.")
                except Exception as e:
                    if "duplicate column name" in str(e).lower():
                        print("Column 'modules' already exists, skipping creation.")
                    else:
                        raise e

                # 2. Populate 'modules' from 'tab_election'
                associations = connection.execute(text("SELECT id, tab_election FROM associations_association")).fetchall()

                default_modules = ['Info', 'Membres', 'Events', 'Posts']

                for id, tab_election in associations:
                    modules = default_modules[:] # Make a copy
                    if tab_election:
                        if 'Elections' not in modules:
                            modules.append('Elections')
                    
                    modules_json = json.dumps(modules)

                    connection.execute(
                        text("UPDATE associations_association SET modules = :modules WHERE id = :id"),
                        {'modules': modules_json, 'id': id}
                    )
                
                print("Populated 'modules' column for all associations.")
                
                trans.commit()
                
                print("\nMigration successful!")
                print("The old 'tab_election' column has NOT been dropped.")
                print("Please verify the data in the 'modules' column.")
                print("After verification, you can manually drop the 'tab_election' column using a DB tool.")
                print("ALTER TABLE associations_association DROP COLUMN tab_election;")

            except Exception as e:
                print(f"An error occurred during migration: {e}")
                trans.rollback()


if __name__ == '__main__':
    migrate()
