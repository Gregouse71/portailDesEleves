from app.models import Association, Election
from app import db

def creer_election (asso_id, data):
    asso = Association.query.filter_by(id=asso_id).all()
    if not asso:
        return None
    if data.get("nom") is None or data.get("options") is None:
        return None

    election = Election(association=asso[0], nom=data.get("nom"), options=data.get("options"))
    election.patch(data)
    db.session.add(election)
    db.session.commit()
    return election