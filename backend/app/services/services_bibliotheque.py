import pandas as pd

from datetime import datetime, timezone

from sqlalchemy import or_, asc, desc

from app.services import db
from app.models import Utilisateur
from app.models.models_bibliotheque import Livre, EmpruntLivre

COLONNES_TRIABLES = ("serie", "auteur", "tome", "etat", "disponible")


def liste_des_livres(asso_id: int, page: int = 1, per_page: int = 20, query: str = "",
                      serie: str = None, disponible: bool = None,
                      order_by: str = "serie", order_asc: bool = True):
    """ Retourne une liste paginee de livres d'une asso, avec recherche texte libre et filtres """
    q = Livre.query.filter(Livre.asso_id == asso_id)

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


def ajouter_nouveau_livre(asso_id: int, serie: str, auteur: str = None, edition: str = None,
                           tome: str = None, reference: str = None, etat: str = None):
    livre = Livre(asso_id, serie, auteur, edition, tome, reference, etat)
    db.session.add(livre)
    db.session.commit()
    return livre.to_dict()

def _clean(value):
    """Convertit NaN / valeurs vides en None, sinon renvoie une string nettoyee."""
    if pd.isna(value):
        return None
    value = str(value).strip()
    return value if value else None


def importer_livres_excel(asso_id: int, fichier):
    """
    Importe des livres depuis un fichier Excel envoye via l'API.
    Colonnes attendues : Auteur | Edition | Série | Tome | Référence | Etat | Statut
    Renvoie {"crees": int, "ignores": int, "lignes_ignorees": [...]}
    """
    df = pd.read_excel(fichier, dtype=str)
    df.columns = [str(c).strip() for c in df.columns]

    crees = 0
    lignes_ignorees = []

    for i, row in df.iterrows():
        numero_ligne = i + 2  # +2 car en-tête = ligne 1, données commencent ligne 2

        serie = _clean(row.get("Série"))
        if not serie:
            lignes_ignorees.append({
                "ligne": numero_ligne,
                "raison": "Série manquante",
            })
            continue

        livre = Livre(
            asso_id=asso_id,
            serie=serie,
            auteur=_clean(row.get("Auteur")),
            edition=_clean(row.get("Edition")),
            tome=_clean(row.get("Tome")),
            reference=_clean(row.get("Référence")),
            etat=_clean(row.get("Etat")),
        )
        db.session.add(livre)
        crees += 1

    db.session.commit()
    return {
        "crees": crees,
        "ignores": len(lignes_ignorees),
        "lignes_ignorees": lignes_ignorees,
    }


def supprimer_livre(asso_id: int, livre_id: int):
    """ Renvoie None si le livre n'existe pas (ou n'appartient pas a l'asso), False s'il est emprunte, True si supprime """
    livre = Livre.query.filter_by(id=livre_id, asso_id=asso_id).first()
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


def liste_emprunts(asso_id: int, page: int = 1, per_page: int = 20,
                    utilisateur_id: int = None, en_cours_seulement: bool = False):
    """ Historique des emprunts d'une asso, le plus recent en premier """
    q = EmpruntLivre.query.join(Livre).filter(Livre.asso_id == asso_id)

    if utilisateur_id:
        q = q.filter(EmpruntLivre.utilisateur_id == utilisateur_id)

    if en_cours_seulement:
        q = q.filter(EmpruntLivre.date_retour.is_(None))

    q = q.order_by(desc(EmpruntLivre.date_emprunt))

    count = q.count()
    emprunts = q.offset((page - 1) * per_page).limit(per_page).all()

    return {"emprunts": [e.to_dict() for e in emprunts], "count": count}