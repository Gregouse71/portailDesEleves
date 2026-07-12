from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc

from datetime import date

from app.models.models_chat import Message

controllers_chat = Blueprint('controllers_chat', __name__)

@controllers_chat.get("/more/<int:last_sent>")
@login_required
def more_chat_message(last_sent: int):
    """
    Renvoie plus de messages à afficher, le dernier vu étant *last_sent*
    """
    query = Message.query
    if last_sent > 0:
        query = query.filter(Message.id < last_sent)
    if not current_user.est_baptise:
        now = date.today()
        rentree = date(now.year, 8, 28) # Messages envoyés avant le 28 aout invisibles
        query = query.filter(Message.date >= rentree)

    messages = query.order_by(desc(Message.id)).limit(100).all()
    return jsonify([message.to_dict() for message in messages[::-1]])
