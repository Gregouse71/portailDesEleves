import sqlite3
from app import db
from app.models.models_evenements import Evenement
from app.models.models_associations import Association
from datetime import datetime
import json

def migrate_evenements():
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Create a mapping from calendar_id to association_id
    calendar_to_asso = {}
    old_db_cursor.execute("SELECT * FROM schedule_calendar")
    calendars = old_db_cursor.fetchall()
    for cal in calendars:
        asso = Association.query.filter_by(nom=cal[1]).first()
        if asso:
            calendar_to_asso[cal[0]] = asso.id

    # Migrate schedule_event
    old_db_cursor.execute("SELECT * FROM schedule_event")
    events = old_db_cursor.fetchall()
    for row in events:
        asso_id = calendar_to_asso.get(row[8])
        if asso_id:
            periodic = row[10] is not None
            
            if periodic:
                old_db_cursor.execute("SELECT * FROM schedule_rule WHERE id=?", (row[10],))
                rule = old_db_cursor.fetchone()
                params = json.loads(rule[4])
                jours = params.get('byday')
                
                new_event = Evenement(
                    id_association=asso_id,
                    nom=row[3],
                    description=row[4],
                    lieu="",
                    evenement_periodique=True,
                    jours_de_la_semaine=jours,
                    heure_de_debut=datetime.strptime(row[1], '%Y-%m-%d %H:%M:%S.%f').time(),
                    heure_de_fin=datetime.strptime(row[2], '%Y-%m-%d %H:%M:%S.%f').time()
                )
            else:
                new_event = Evenement(
                    id_association=asso_id,
                    nom=row[3],
                    description=row[4],
                    lieu="",
                    evenement_periodique=False,
                    date_de_debut=datetime.strptime(row[1], '%Y-%m-%d %H:%M:%S.%f'),
                    date_de_fin=datetime.strptime(row[2], '%Y-%m-%d %H:%M:%S.%f')
                )
            
            new_event.id = row[0]
            db.session.add(new_event)

    db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()
