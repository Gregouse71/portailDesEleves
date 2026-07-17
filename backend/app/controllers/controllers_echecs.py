from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.services.services_echecs import (
    liste_defis, creer_defi, annuler_defi, accepter_defi,
    get_partie, coups_legaux, jouer_coup, leaderboard_elo,
    abandonner, proposer_nulle, accepter_nulle
)

controllers_echecs = Blueprint('controllers_echecs', __name__)


@controllers_echecs.get('/defis')
@login_required
def get_defis():
    return jsonify(liste_defis(current_user.id)), 200


@controllers_echecs.post('/defis')
@login_required
def post_defi():
    data = request.json or {}
    try:
        return jsonify(creer_defi(current_user, data)), 201
    except ValueError as e:
        return jsonify({'message': str(e)}), 400


@controllers_echecs.delete('/defis/<int:defi_id>')
@login_required
def delete_defi(defi_id: int):
    try:
        annuler_defi(defi_id, current_user.id)
        return jsonify({'ok': True}), 200
    except PermissionError as e:
        return jsonify({'erreur': str(e)}), 403


@controllers_echecs.post('/defis/<int:defi_id>/accepter')
@login_required
def post_accepter_defi(defi_id: int):
    try:
        return jsonify(accepter_defi(defi_id, current_user)), 201
    except (ValueError, PermissionError) as e:
        return jsonify({'erreur': str(e)}), 400


@controllers_echecs.get('/parties/<int:partie_id>')
@login_required
def get_partie_route(partie_id: int):
    return jsonify(get_partie(partie_id)), 200


@controllers_echecs.get('/parties/<int:partie_id>/coups_legaux')
@login_required
def get_coups_legaux(partie_id: int):
    case  = request.args.get('case', type=int)
    coups = coups_legaux(partie_id, case, current_user.id)
    return jsonify({'coups': coups}), 200


@controllers_echecs.put('/parties/<int:partie_id>')
@login_required
def put_coup(partie_id: int):
    data = request.json or {}
    try:
        return jsonify(jouer_coup(partie_id, current_user.id, data)), 200
    except (ValueError, PermissionError) as e:
        return jsonify({'erreur': str(e)}), 400


@controllers_echecs.get('/leaderboard')
@login_required
def get_leaderboard():
    return jsonify(leaderboard_elo(current_user.id)), 200


@controllers_echecs.post('/parties/<int:partie_id>/abandonner')
@login_required
def post_abandonner(partie_id: int):
    try:
        return jsonify(abandonner(partie_id, current_user.id)), 200
    except (ValueError, PermissionError) as e:
        return jsonify({'erreur': str(e)}), 400


@controllers_echecs.post('/parties/<int:partie_id>/proposer_nulle')
@login_required
def post_proposer_nulle(partie_id: int):
    try:
        return jsonify(proposer_nulle(partie_id, current_user.id)), 200
    except (ValueError, PermissionError) as e:
        return jsonify({'erreur': str(e)}), 400


@controllers_echecs.post('/parties/<int:partie_id>/accepter_nulle')
@login_required
def post_accepter_nulle(partie_id: int):
    try:
        return jsonify(accepter_nulle(partie_id, current_user.id)), 200
    except (ValueError, PermissionError) as e:
        return jsonify({'erreur': str(e)}), 400