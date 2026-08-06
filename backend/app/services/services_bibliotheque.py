from datetime import datetime, timezone

from sqlalchemy import or_, asc, desc

from app.services import db
from app.models import Utilisateur
from app.models.models_bibliotheque import Livre, EmpruntLivre

COLONNES_TRIABLES = ("serie", "auteur", "tome", "etat", "disponible")


def liste_des_livres(page: int = 1, per_page: int = 20, query: str = "",
                      serie: str = None, disponible: bool = None,
                      order_by: str = "serie", order_asc: bool = True):
    """ Retourne une liste paginee de livres, avec recherche texte libre et filtres """
    q = Livre.query

    if query:
        like = f"%{query}%"
        q = q.filter(or_(
            Livre.serie.ilike(like),
            Livre.auteur.ilike(like),
            Livre.reference.ilike(like),
        ))

    if serie:
        q = q.filter(Livre.serie == serie)

    if disponible is not None:
        q = q.filter(Livre.disponible == disponible)

    colonne = getattr(Livre, order_by if order_by in COLONNES_TRIABLES else "serie")
    q = q.order_by(asc(colonne) if order_asc else desc(colonne))

    count = q.count()
    livres = q.offset((page - 1) * per_page).limit(per_page).all()

    return {"livres": [l.to_dict() for l in livres], "count": count}


def ajouter_nouveau_livre(serie: str, auteur: str = None, edition: str = None,
                           tome: str = None, reference: str = None, etat: str = None):
    livre = Livre(serie, auteur, edition, tome, reference, etat)
    db.session.add(livre)
    db.session.commit()
    return livre.to_dict()


def supprimer_livre(livre_id: int):
    """ Renvoie None si le livre n'existe pas, False s'il est emprunte, True si supprime """
    livre = Livre.query.get(livre_id)
    if not livre:
        return None
    if not livre.disponible:
        return False

    db.session.delete(livre)
    db.session.commit()
    return True


def emprunter_livre(livre: Livre, utilisateur: Utilisateur, auteur: Utilisateur):
    """ Associe un livre disponible a un utilisateur emprunteur. Renvoie None si le livre n'est pas disponible """
    if not livre.disponible:
        return None

    emprunt = EmpruntLivre(livre, utilisateur, auteur)
    livre.disponible = False

    db.session.add(emprunt)
    db.session.commit()
    return livre.to_dict()


def retourner_livre(livre: Livre, auteur: Utilisateur):
    """ Cloture l'emprunt en cours et remet le livre disponible. Renvoie None si le livre n'etait pas emprunte """
    emprunt = livre.emprunt_en_cours()
    if not emprunt:
        return None

    emprunt.date_retour = datetime.now(timezone.utc)
    livre.disponible = True

    db.session.commit()
    return livre.to_dict()


def liste_emprunts(page: int = 1, per_page: int = 20, utilisateur_id: int = None, en_cours_seulement: bool = False):
    """ Historique des emprunts, le plus recent en premier """
    q = EmpruntLivre.query

    if utilisateur_id:
        q = q.filter(EmpruntLivre.utilisateur_id == utilisateur_id)

    if en_cours_seulement:
        q = q.filter(EmpruntLivre.date_retour.is_(None))

    q = q.order_by(desc(EmpruntLivre.date_emprunt))

    count = q.count()
    emprunts = q.offset((page - 1) * per_page).limit(per_page).all()

    return {"emprunts": [e.to_dict() for e in emprunts], "count": count}