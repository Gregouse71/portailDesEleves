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

    # --- Migrate Periodic Events from schedule_event ---
    
    # Create a mapping from calendar_id to association_id
    calendar_to_asso = {}
    old_db_cursor.execute("SELECT * FROM schedule_calendar")
    calendars = old_db_cursor.fetchall()
    for cal in calendars:
        asso = Association.query.filter_by(nom=cal[1]).first()
        if asso:
            calendar_to_asso[cal[0]] = asso.id

    # Select only periodic events
    old_db_cursor.execute("SELECT * FROM schedule_event WHERE rule_id IS NOT NULL")
    periodic_events = old_db_cursor.fetchall()
    for row in periodic_events:
        asso_id = calendar_to_asso.get(row[8])
        if asso_id:
            old_db_cursor.execute("SELECT * FROM schedule_rule WHERE id=?", (row[10],))
            rule = old_db_cursor.fetchone()
            if rule:
                params = json.loads(rule[4])
                jours = params.get('byday')
                
                try:
                    heure_debut = datetime.strptime(row[1], '%Y-%m-%d %H:%M:%S.%f').time()
                    heure_fin = datetime.strptime(row[2], '%Y-%m-%d %H:%M:%S.%f').time()
                except ValueError:
                    heure_debut = datetime.strptime(row[1], '%Y-%m-%d %H:%M:%S').time()
                    heure_fin = datetime.strptime(row[2], '%Y-%m-%d %H:%M:%S').time()

                new_event = Evenement(
                    id_association=asso_id,
                    nom=row[3],
                    description=row[4].replace('\\r\\n', '\n').strip() if row[4] else None,
                    lieu="",  # 'lieu' is not available in schedule_event
                    evenement_periodique=True,
                    jours_de_la_semaine=jours,
                    heure_de_debut=heure_debut,
                    heure_de_fin=heure_fin
                )
                if not Evenement.query.get(row[0]):
                    new_event.id = row[0]
                    db.session.add(new_event)

    # --- Migrate Non-Periodic Events from evenement_evenement ---
    old_db_cursor.execute("SELECT * FROM evenement_evenement")
    non_periodic_events = old_db_cursor.fetchall()
    for row in non_periodic_events:
        # schema: id, createur_id, association_id, titre, description, date_debut, date_fin, lieu, billetterie_id
        asso_id = row[2]
        asso = Association.query.get(asso_id)
        if asso:
            try:
                date_debut = datetime.strptime(row[5], '%Y-%m-%d %H:%M:%S')
                date_fin = datetime.strptime(row[6], '%Y-%m-%d %H:%M:%S')
            except (ValueError, TypeError):
                try:
                    date_debut = datetime.strptime(row[5], '%Y-%m-%d %H:%M:%S.%f')
                    date_fin = datetime.strptime(row[6], '%Y-%m-%d %H:%M:%S.%f')
                except (ValueError, TypeError):
                    date_debut = None
                    date_fin = None

            if date_debut and date_fin:
                new_event = Evenement(
                    id_association=asso_id,
                    nom=row[3],
                    description=row[4].replace('\\r\\n', '\n').strip() if row[4] else None,
                    lieu=row[7],
                    evenement_periodique=False,
                    date_de_debut=date_debut,
                    date_de_fin=date_fin
                )
                if not Evenement.query.get(row[0]):
                    new_event.id = row[0]
                    db.session.add(new_event)

    db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()
