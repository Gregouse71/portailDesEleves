import os
from datetime import datetime
from werkzeug.utils import secure_filename

from sqlalchemy.orm.attributes import flag_modified
from app.models.models_associations import Association
from app.models.modules.models_elections import Election
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


def patch_election(election, data):
    """
    Modifie l'objet avec les clés dans data.
    Ce qui n'est pas précisé n'est pas changé.
    """

    # Supression de simages inutiles
    for opt in election.options:
        flag_modified(election, "options")
        if opt not in data.get("options", []):
            im = opt.get("image")
            if im and len(im) > 0:
                path = os.path.join('upload', im)
                if os.path.exists(path):
                    os.remove(path)

    election.nom = data.get("nom", election.nom)
    election.description = data.get("description", election.description)
    election.visible = data.get("visible", election.visible)
    election.options = data.get("options", election.options)
    election.promos = data.get("promos", election.promos)
    election.date_ouverture = data.get("date_ouverture", election.date_ouverture)
    election.date_fermeture = data.get("date_fermeture", election.date_fermeture)
    return election


def ajouter_photo(file, election, choix):
    """
    Ajoute une photo pour l'option n° *choix* de l'election,
    en supprimant d'autres deja existantes
    """
    UPLOAD_FOLDER = os.path.join('upload', 'associations', election.association.nom_dossier)
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    ALREADY = election.options[choix].get("image")
    if ALREADY:
        OLD = os.path.join('upload', ALREADY)
        if os.path.exists(OLD):
            os.remove(OLD)

    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{name}_{timestamp}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    path = os.path.join('associations', election.association.nom_dossier, filename)
    election.options[choix]["image"] = path
    flag_modified(election, "options")
    db.session.add(election)
    db.session.commit()
    return path


def supprimer_election(election):
    """
    Supprime l'election
    """
    for vote in election.votes:
        db.session.delete(vote)
    db.session.delete(election)
    for choix in election.options:
        im = choix.get("image")
        if im and len(im) > 0:
            path = os.path.join('upload', im)
            if os.path.exists(path):
                os.remove(path)

    db.session.commit()
    return election