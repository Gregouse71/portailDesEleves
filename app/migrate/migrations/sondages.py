import sqlite3
from app import db
from app.models.models_sondages import Sondage, VoteSondage
from app.models.models_utilisateurs import Utilisateur
from app.services.services_sondages import _resultat_sondage, _donner_votes_gagnants_perdants
from datetime import datetime

def migrate_sondages():
    # Connect to the old database
    old_db_conn = sqlite3.connect('instance/old_database.db')
    old_db_cursor = old_db_conn.cursor()

    # Migrate sondages_sondage
    old_db_cursor.execute("SELECT * FROM sondages_sondage")
    sondages = old_db_cursor.fetchall()
    for row in sondages:
        reponses = [row[3], row[4]]
        new_sondage = Sondage(
            propose_par_user_id=row[1],
            date_proposition = datetime.now(),
            question=row[2],
            reponses=reponses,
            autorise=bool(row[7])
        )
        new_sondage.id = row[0]
        new_sondage.archive = bool(row[5])

        # Handle date_publication gracefully
        if row[6] and row[6] != '0000-00-00':
            try:
                new_sondage.date_publication = datetime.strptime(row[6], '%Y-%m-%d')
            except ValueError:
                new_sondage.date_publication = None # Set to None if parsing fails
        else:
            new_sondage.date_publication = None

        db.session.add(new_sondage)
        print(f"Migrated sondage {row[0]}")

    db.session.commit()

    # Migrate sondages_vote
    old_db_cursor.execute("SELECT * FROM sondages_vote")
    votes = old_db_cursor.fetchall()
    for row in votes:
        sondage = Sondage.query.get(row[1])
        utilisateur = Utilisateur.query.get(row[2])
        if sondage and utilisateur:
            # Check if a vote already exists for this sondage and user
            existing_vote = VoteSondage.query.filter_by(
                sondage_id=sondage.id,
                utilisateur_id=utilisateur.id
            ).first()

            if not existing_vote:
                new_vote = VoteSondage(
                    sondage=sondage,
                    utilisateur=utilisateur,
                    vote=row[3]
                )
                db.session.add(new_vote)
                print(f"Migrated vote {row[0]}")
            else:
                print(f"Skipped duplicate vote {row[0]} for sondage {sondage.id} by user {utilisateur.id}")

    db.session.commit()

    # Close the connection to the old database
    old_db_conn.close()

    sondages = Sondage.query.all()
    for s in sondages:
        compteur_votes = _resultat_sondage(s.id)  # On récupère le résultat
        gagnants, perdants = _donner_votes_gagnants_perdants(compteur_votes)  # On détermine les votes gagnants
        votes = VoteSondage.query.filter_by(sondage_id=s.id).all()
        for vote in votes:  # Pour chaque vote, on détermine s'il est gagnant
            vote.gagnant = vote.vote - 1 in gagnants # /!\ L'indexation n'est pas la même dans la table vote ou sondage
            vote.perdant = vote.vote - 1 in perdants
            db.session.add(vote)
        s.gagnants = gagnants
        s.perdants = perdants
        db.session.add(s)
        db.session.commit()
        print(f"Migrated sondage {s} : {s.gagnants} {s.perdants}")