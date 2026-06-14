from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.services.services_jeux import new_game, faire_un_coup, leaderboard
from app.models.models_jeux import JeuxPartie

controller_jeux = Blueprint('controller_jeux', __name__)

@controller_jeux.post("/partie")
@login_required
def post_nouvelle_partie():
    """
    Crée une nouvelle partie pour l'utilisateur qui post ça
    """
    data = request.json
    return jsonify(new_game(data["jeu"], current_user)), 200


@controller_jeux.get("/partie/<string:jeu>")
@login_required
def get_partie_en_cours(jeu: str):
    """
    Récupère la partie en cours au jeu *jeu* pour l'utilisateur qui demande
    """
    partie = JeuxPartie.query.filter_by(utilisateur_id=current_user.id, terminee=False, jeu=jeu).first()
    if partie is None:
        return jsonify({})
    return jsonify(partie.to_dict())


@controller_jeux.put("/partie/<string:s>")
@login_required
def put_partie(s: str):
    """
    Joue un coup sur la partie du jeu  *id*
    """
    data = request.json
    return jsonify(faire_un_coup(s, current_user.id, data)), 200


@controller_jeux.get("/leaderboard/<string:s>")
@login_required
def get_leaderboard_jeu(s: str):
    """
    Renvoie le leaderboard du jeu *s*
    """
    return jsonify(leaderboard(s)), 200
