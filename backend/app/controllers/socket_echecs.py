# app/controllers/echecs_socket.py
# Même pattern que chat_socket.py

from flask_login import current_user
from flask_socketio import emit, join_room

from app import socketio
from app.services.services_echecs import jouer_coup, coups_legaux


@socketio.on('echecs_rejoindre')
def on_rejoindre(data):
    """Le client rejoint la room de la partie."""
    join_room(f'echecs_{data["partie_id"]}')


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