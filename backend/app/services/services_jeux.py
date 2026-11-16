from sqlalchemy import desc, func
import redis
from datetime import datetime, UTC

from app import db
from app.models import JeuxPartie, Utilisateur
from app.services.games.services_2048 import coup_2048
from app.services.games.services_atc import verify_and_score_atc

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def leaderboard(jeu: str):
    top = (
        db.session.query(
            Utilisateur,
            func.max(JeuxPartie.score).label("score")
        )
        .join(JeuxPartie.utilisateur)
        .filter(JeuxPartie.jeu == jeu, JeuxPartie.terminee == True)
        .group_by(Utilisateur.id)
        .order_by(desc("score"))
        .limit(10)
        .all()
    )

    return [{"nom": f"{u.prenom} {u.nom}", "id": u.id, "score": score} for u, score in top]

def new_game(jeu: str, user):
    """
    Crée une partie au jeu demandé pour l'utilisateur demandé,
    les parties déjà en cours sont terminées
    """
    if jeu in ["2048"]:
        en_cours = JeuxPartie.query.filter_by(utilisateur_id=user.id, terminee=False, jeu=jeu)
        for g in en_cours:
            if jeu == "2048" and g.score > user.meilleur_score_2048:
                user.meilleur_score_2048 = g.score
                db.session.add(user)
            g.terminee = True
            g.fin = datetime.now(UTC)
            db.session.add(g)

        new = JeuxPartie(user, jeu)
        db.session.add(new)
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
    lock = redis.lock.Lock(redis_client, lock_key, timeout=1, blocking=False)
    lock_acquired = lock.acquire()

    if not lock_acquired:
        return partie.to_dict()

    try:
        if partie.jeu == "2048" and s == partie.jeu:
            if data.get("score") != partie.score:
                return partie.to_dict()
            partie = coup_2048(partie, data)
            if partie.is_game_over():
                partie.terminee = True
                partie.fin = datetime.now(UTC)
                if partie.score > partie.utilisateur.meilleur_score_2048:
                    partie.utilisateur.meilleur_score_2048 = partie.score
                    db.session.add(partie.utilisateur)

            db.session.add(partie)
            db.session.commit()
            return partie.to_dict()
    finally:
        try:
            lock.release()
        except redis.exceptions.LockNotOwnedError:
            pass

    return None
