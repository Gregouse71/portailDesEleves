from flask import Blueprint, jsonify, request, abort, send_file
import zipfile
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload
import io
import csv

from app import db
from app.models.modules.models_elections import Election, ElectionVote, ElectionVoteChiffre
from app.utils.decorators import superutilisateur_required
from app.services.modules.services_elections import creer_election, ajouter_photo, supprimer_election, patch_election, voter

controllers_elections = Blueprint('controllers_elections', __name__)

UPLOAD_FOLDER = 'upload/associations'

@controllers_elections.post("/election/image/<int:id>/<int:choix>")
@login_required
@superutilisateur_required
def upload_election_choice_image(id, choix):
    election = Election.query.filter_by(id=id).with_for_update().first()
    if not election:
        return jsonify({"success": False, "message": "Election introuvable"}), 404

    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if file:
        ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
        if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
            return jsonify({"success": False, "message": "Extension de fichier non autorisée"}), 400
        path = ajouter_photo(file, election, choix)
    return jsonify({"path": path})


@controllers_elections.get("/asso/<int:id>")
@login_required
def get_elections_par_asso(id: int):
    """
    Renvoie la liste des elections de l'association
    """
    elections = Election.query.filter_by(association_id=id).all()
    return jsonify([e.id for e in elections])


@controllers_elections.get("/election/<int:id>")
@login_required
def get_election_by_id(id: int):
    """
    Renvoie l'election qui a pour id *id*
    """
    election = Election.query.filter_by(id=id).first()
    if election is None:
        return abort(404)
    if election.visible or current_user.est_superutilisateur:
        ret = election.to_dict()
        ret["deja_vote"] = ElectionVote.query.filter_by(election_id=id, utilisateur_id=current_user.id).count() > 0
        ret["votant"] = current_user.promotion in election.promos
        return jsonify(ret)
    else:
        return abort(403)


@controllers_elections.post("/election/<int:asso_id>")
@login_required
@superutilisateur_required
def post_election(asso_id: int):
    """
    Crée une élection
    """
    election = creer_election(asso_id, request.json)
    if not election:
        return jsonify({"message": "erreur lors de la création de l'election"}), 500
    return jsonify(election.to_dict())


@controllers_elections.delete("/election/<int:id>")
@login_required
@superutilisateur_required
def delete_election(id: int):
    """
    Supprime l'election
    """
    election = db.session.query(Election).get(id)
    if not election:
        return jsonify({"message": "L'election n'existe pas"}), 400
    supprimer_election(election)
    return jsonify({"message": ""}), 200 


@controllers_elections.put("/election/<int:id>")
@login_required
@superutilisateur_required
def patch_election_by_id(id: int):
    """
    Modifie l'élection
    """
    data = request.json
    election = Election.query.filter_by(id=id).first()
    patch_election(election, data)
    db.session.commit()
    return jsonify(election.to_dict())


@controllers_elections.post("/voter/<int:id>")
@login_required
def voter_election(id: int):
    choix = request.json.get("choix")
    if choix is None:
        return jsonify({"message": "Choix invalide"}), 400
    election = Election.query.filter_by(id=id).first()
    if election is None:
        return jsonify({"message": "Election invalide"}), 400

    voter(choix, election, current_user)
    return jsonify({"status": "success"}), 200


@controllers_elections.get("/resultats/<int:id>")
@login_required
@superutilisateur_required
def resultats_election(id: int):
    election = db.session.query(Election).get(id)

    # Create an in-memory zip file
    memory_file = io.BytesIO()
    with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        # --- 1. Votes CSV ---
        votes_proxy = io.StringIO()
        votes = db.session.query(ElectionVote).options(joinedload(ElectionVote.utilisateur)).filter_by(election_id=id).all()
        if votes:
            fieldnames = ["choix", "utilisateur_id", "election_id", "utilisateur.nom_utilisateur", "utilisateur.chambre", "utilisateur.promotion", "utilisateur.cycle"]
            writer = csv.DictWriter(votes_proxy, fieldnames=fieldnames)
            writer.writeheader()
            for vote in votes:
                row = {}
                for col in fieldnames:
                    if "." in col:
                        obj, attr = col.split(".")
                        row[col] = getattr(getattr(vote, obj), attr) if hasattr(vote, obj) and getattr(vote, obj) is not None else ""
                    else:
                        row[col] = getattr(vote, col)
                writer.writerow(row)
        
        zf.writestr(f'liste_votants_{election.nom}.csv', votes_proxy.getvalue())
        votes_proxy.close()

        # --- 2. Encrypted Votes CSV ---
        if election.chiffree:
            chiffres_proxy = io.StringIO()
            votes_chiffres = db.session.query(ElectionVoteChiffre).filter_by(election_id=id).all()
            if votes_chiffres:
                fieldnames_chiffres = ["date", "choix", "ciphertext", "promotion", "cycle", "etage"]
                writer_chiffres = csv.DictWriter(chiffres_proxy, fieldnames=fieldnames_chiffres)
                writer_chiffres.writeheader()
                for vote_chiffre in votes_chiffres:
                    writer_chiffres.writerow({
                        "date": vote_chiffre.date,
                        "choix": vote_chiffre.choix,
                        "ciphertext": vote_chiffre.ciphertext,
                        "promotion": vote_chiffre.promotion,
                        "cycle": vote_chiffre.cycle,
                        "etage": vote_chiffre.etage
                    })
            
            zf.writestr(f'resultats_chiffres_{election.nom}.csv', chiffres_proxy.getvalue())
            chiffres_proxy.close()

            chiffres_proxy = io.StringIO()
            votes_chiffres = db.session.query(ElectionVoteChiffre).filter_by(election_id=id).all()
            if votes_chiffres:
                fieldnames_chiffres = ["choix", "ciphertext"]
                writer_chiffres = csv.DictWriter(chiffres_proxy, fieldnames=fieldnames_chiffres)
                writer_chiffres.writeheader()
                for vote_chiffre in votes_chiffres:
                    writer_chiffres.writerow({
                        "choix": vote_chiffre.choix,
                        "ciphertext": vote_chiffre.ciphertext
                    })
            
            zf.writestr(f'resultats_a_diffuser_{election.nom}.csv', chiffres_proxy.getvalue())
            chiffres_proxy.close()

    memory_file.seek(0)

    return send_file(
        memory_file,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f'resultats_{election.nom}.zip'
    )