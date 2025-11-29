import sqlite3
from app import db
from app.models.models_chat import Message
from app.models.models_utilisateurs import Utilisateur
from datetime import datetime

def migrate_chat():
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Migrate chat_message
    old_db_cursor.execute("SELECT * FROM chat_message")
    messages = old_db_cursor.fetchall()
    for row in messages:
        author = Utilisateur.query.get(row[1])
        if author:
            new_message = Message(
                text=row[4],
                author=author,
                date=datetime.strptime(row[6], '%Y-%m-%d %H:%M:%S')
            )
            new_message.id = row[0]
            db.session.add(new_message)
            print(f"Migrated message {row[0]}")

    db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()
