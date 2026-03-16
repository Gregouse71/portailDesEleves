from sqlalchemy import desc
import redis

from app import db
from app.models import JeuxPartie

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def leaderboard(jeu: str):
    top = JeuxPartie.query.filter_by(jeu=jeu, terminee=True).order_by(desc(JeuxPartie.score)).limit(10)
    return [{"nom": f"{p.utilisateur.prenom} {p.utilisateur.nom}", "id": p.utilisateur.id, "score": p.score} for p in top]

def new_game(jeu, user):
    """
    Crée une partie au jeu demandé pour l'utilisateur demandé,
    les parties déjà en cours sont terminées
    """
    if jeu == "2048":
        en_cours = JeuxPartie.query.filter_by(utilisateur_id=user.id, terminee=False, jeu="2048")
        for g in en_cours:
            if g.score > user.meilleur_score_2048:
                user.meilleur_score_2048 = g.score
            g.terminee = True
            db.session.add(g)

        new = JeuxPartie(user, "2048")
        db.session.add(new)
        db.session.add(user)
        db.session.commit()
        return new.to_dict()
    return {"status": "jeu invalide"}

def faire_un_coup(s: str, id: int, data: dict):
    """
    Fait le coup contenu dans *data* pour la partie du jeu *s* pour le joueur *id*
    """
    partie = JeuxPartie.query.filter_by(utilisateur_id=id, jeu=s, terminee=False).first()
    if partie is None:
        return None

    lock_key = f"lock:game:{s}:{id}"
    lock_acquired = redis_client.set(lock_key, "locked", ex=5, nx=True)

    if not lock_acquired:
        redis_client.delete(lock_key)
        return partie.to_dict()

    try:
        if partie.jeu == "2048" and s == partie.jeu:
            if data.get("score") != partie.score:
                return partie.to_dict()
            partie = coup_2048(partie, data)
            if partie.is_game_over():
                partie.terminee = True
                if partie.score > partie.utilisateur.meilleur_score_2048:
                    partie.utilisateur.meilleur_score_2048 = partie.score
                    db.session.add(partie.utilisateur)

            db.session.add(partie)
            db.session.commit()
            return partie.to_dict()
    finally:
        redis_client.delete(lock_key)
    
    return None

def _transpose(board):
    return [list(row) for row in zip(*board)]

def _move_left(row):
    new_row = [i for i in row if i != 0]
    score = 0
    i = 0
    while i < len(new_row) - 1:
        if new_row[i] == new_row[i+1]:
            new_row[i] *= 2
            score += new_row[i]
            new_row.pop(i+1)
        i += 1
    new_row.extend([0] * (4 - len(new_row)))
    return new_row, score


def coup_2048(partie: JeuxPartie, data: dict):
    board = partie.etat["plateau"]
    initial = board[:]
    move = data["coup"]
    score_increment = 0

    if move == 'gauche':
        for i in range(4):
            board[i], score = _move_left(board[i])
            score_increment += score
    elif move == 'droite':
        for i in range(4):
            reversed_row, score = _move_left(board[i][::-1])
            board[i] = reversed_row[::-1]
            score_increment += score
    elif move == 'haut':
        board = _transpose(board)
        for i in range(4):
            board[i], score = _move_left(board[i])
            score_increment += score
        board = _transpose(board)
    elif move == 'bas':
        board = _transpose(board)
        for i in range(4):
            reversed_row, score = _move_left(board[i][::-1])
            board[i] = reversed_row[::-1]
            score_increment += score
        board = _transpose(board)

    partie.score += score_increment

    if board != initial:
        partie.etat["plateau"] = board
        partie.add_random_tile()

    return partie