from flask import Blueprint, jsonify, request, send_file
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload
import io
import csv

from app import db
from app.models.models_elections import Election, ElectionVote
from app.utils.decorators import superutilisateur_required
from app.services.services_elections import creer_election

controller_elections = Blueprint('controller_elections', __name__)

@controller_elections.get("/asso/<int:id>")
@login_required
def get_elections_par_asso(id: int):
    """
    Renvoie la liste des elections de l'association
    """
    elections = Election.query.filter_by(association_id=id).all()
    return jsonify([e.id for e in elections])


@controller_elections.get("/election/<int:id>")
@login_required
def get_election_by_id(id: int):
    """
    Renvoie l'election qui a pour id *id*
    """
    election = Election.query.filter_by(id=id).first()
    if election.visible or current_user.est_superutilisateur:
        ret = election.to_dict()
        ret["deja_vote"] = ElectionVote.query.filter_by(election_id=id, utilisateur_id=current_user.id).count() > 0
        ret["votant"] = current_user.promotion in election.promos
        return jsonify(ret)
    else:
        return jsonify({"message": ""}), 403


@controller_elections.post("/election/<int:asso_id>")
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


@controller_elections.delete("/election/<int:id>")
@login_required
@superutilisateur_required
def delete_election(id: int):
    """
    Supprime l'election
    """
    election = Election.query.filter_by(id=id).first()
    if not election:
        return jsonify({"message": "L'election n'existe pas"}), 400
    for vote in election.votes:
        db.session.delete(vote)
    db.session.delete(election)
    db.session.commit()
    return jsonify({"message": ""}), 200 


@controller_elections.put("/election/<int:id>")
@login_required
@superutilisateur_required
def patch_election_by_id(id: int):
    """
    Modifie l'élection
    """
    data = request.json
    election = Election.query.filter_by(id=id).first()
    election.patch(data)
    db.session.add(election)
    db.session.commit()
    return jsonify(election.to_dict())


@controller_elections.post("/voter/<int:id>")
@login_required
def voter_election(id: int):
    choix = request.json.get("choix")
    if choix is None:
        return jsonify({"message": "Choix invalide"}), 400
    election = Election.query.filter_by(id=id).first()
    if election is None:
        return jsonify({"message": "Election invalide"}), 400
    if current_user.promotion not in election.promos:
        return jsonify({"message": "Non electeur"}), 403
    deja = ElectionVote.query.filter_by(election_id=id, utilisateur_id=current_user.id).count()
    if deja > 0:
        return jsonify({"message": "Deja voté"}), 403

    vote = ElectionVote(int(choix), election, current_user)
    db.session.add(vote)
    db.session.commit()

    return jsonify({"status": "success"}), 200


@controller_elections.get("/resultats/<int:id>")
@login_required
@superutilisateur_required
def resultats_election(id: int):
    proxy = io.StringIO()

    votes = db.session.query(ElectionVote).options(joinedload(ElectionVote.utilisateur)).filter_by(election_id=id).all()

    if votes:
        fieldnames = ["choix", "utilisateur_id", "election_id", "utilisateur.nom_utilisateur", "utilisateur.chambre", "utilisateur.promotion", "utilisateur.cycle"]
        writer = csv.DictWriter(proxy, fieldnames=fieldnames)

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

    proxy.seek(0)

    mem = io.BytesIO()
    mem.write(proxy.getvalue().encode('utf-8'))
    mem.seek(0)
    proxy.close()

    return send_file(
        mem,
        mimetype='text/csv',
        as_attachment=True,
        download_name='users_export.csv'
    )