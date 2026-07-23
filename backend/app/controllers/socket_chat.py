from flask_login import current_user

from app.models.models_chat import Message
from app import db

from .. import socketio
from flask_socketio import emit
from datetime import datetime, timezone


@socketio.on('connect')
def join():
    if current_user.is_authenticated:
        # messages = Message.query.order_by(desc(Message.id)).limit(100).all()
        # for message in messages[::-1]: # Ils sont envoyés dans l'ordre de réception : les plus anciens d'abord
        #     to_send = message.to_dict()
        #     to_send["sound"] = False
        #     emit ("message", to_send)
        return True
    else:
        return False  # not allowed here


@socketio.on('message')
def handle_message(data):
    if current_user.is_authenticated:
        message = Message (data["text"], current_user, datetime.now (timezone.utc))
        db.session.add(message)
        db.session.commit()
        
        to_send = message.to_dict()
        to_send["sound"] = True
        emit ("message", to_send, broadcast=True)
    else:
        return False

@socketio.on('disconnect')
def handle_disconnect():
    return
