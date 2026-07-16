from flask_login import current_user
from flask_socketio import emit, join_room, leave_room

from app import socketio
from app.services.services_echecs import (
    jouer_coup, coups_legaux, get_partie,
    abandonner, proposer_nulle, accepter_nulle,
)


@socketio.on('echecs_rejoindre')
def on_rejoindre(data):
    """Le client rejoint la room de la partie et reçoit l'état courant."""
    if not current_user.is_authenticated:
        return False
    join_room(f'echecs_{data["partie_id"]}')
    emit('echecs_etat', get_partie(data['partie_id']))


@socketio.on('echecs_quitter')
def on_quitter(data):
    leave_room(f'echecs_{data["partie_id"]}')


@socketio.on('echecs_coup')
def on_coup(data):
    """
    Reçoit un coup et le joue.
    Payload : { partie_id, de, vers, promotion? }
    """
    if not current_user.is_authenticated:
        return False

    try:
        result = jouer_coup(data['partie_id'], current_user.id, data, socketio)
        if result.get('besoin_promotion'):
            emit('echecs_promotion', result)
    except (ValueError, PermissionError) as e:
        emit('echecs_erreur', {'erreur': str(e)})


@socketio.on('echecs_coups_legaux')
def on_coups_legaux(data):
    """Payload : { partie_id, case }"""
    if not current_user.is_authenticated:
        return False
    coups = coups_legaux(data['partie_id'], data['case'], current_user.id)
    emit('echecs_coups_legaux_resultat', {'case': data['case'], 'coups': coups})


@socketio.on('echecs_abandonner')
def on_abandonner(data):
    if not current_user.is_authenticated:
        return False
    try:
        abandonner(data['partie_id'], current_user.id, socketio)
    except (ValueError, PermissionError) as e:
        emit('echecs_erreur', {'erreur': str(e)})


@socketio.on('echecs_proposer_nulle')
def on_proposer_nulle(data):
    if not current_user.is_authenticated:
        return False
    try:
        proposer_nulle(data['partie_id'], current_user.id, socketio)
    except (ValueError, PermissionError) as e:
        emit('echecs_erreur', {'erreur': str(e)})


@socketio.on('echecs_accepter_nulle')
def on_accepter_nulle(data):
    if not current_user.is_authenticated:
        return False
    try:
        accepter_nulle(data['partie_id'], current_user.id, socketio)
    except (ValueError, PermissionError) as e:
        emit('echecs_erreur', {'erreur': str(e)})