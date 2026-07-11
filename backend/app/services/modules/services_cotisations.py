from datetime import datetime
from app import db
from app.models.models_associations import Association
from app.models.models_utilisateurs import Utilisateur
from app.models.modules.models_cotisations import AssociationCotisation, AssociationCotisationUtilisateur

def get_cotisations_for_association(association_id):
    """Gets all cotisations for a given association."""
    return AssociationCotisation.query.filter_by(association_id=association_id).all()

def cotisations_actives_asso (association_id):
    """Renvoie les cotisations actives de l'asso"""
    today = datetime.now().date()
    return AssociationCotisation.query.filter(
        AssociationCotisation.association_id == association_id,
        AssociationCotisation.date_debut <= today,
        AssociationCotisation.date_fin >= today
    ).all()

def creer_cotisation(asso_id, data):
    """Creates a new cotisation for an association."""
    try:
        asso = db.session.get(Association, asso_id)
        if not asso:
            return None
        if not data.get("nom") or not data.get("date_debut") or not data.get("date_fin"):
            return None

        # Parse dates
        if isinstance(data["date_debut"], str):
            date_debut = datetime.strptime(data["date_debut"].split("T")[0], "%Y-%m-%d").date()
        else:
            date_debut = data["date_debut"]

        if isinstance(data["date_fin"], str):
            date_fin = datetime.strptime(data["date_fin"].split("T")[0], "%Y-%m-%d").date()
        else:
            date_fin = data["date_fin"]

        cotisation = AssociationCotisation(
            nom=data["nom"],
            association=asso,
            date_debut=date_debut,
            date_fin=date_fin
        )
        db.session.add(cotisation)
        db.session.commit()
        return cotisation
    except Exception as e:
        db.session.rollback()
        print(f"Error creating cotisation: {e}")
        return None

def patch_cotisation(cotisation, data):
    """Updates a cotisation with provided data."""
    try:
        cotisation.update(data)
        db.session.commit()
        return cotisation
    except Exception as e:
        db.session.rollback()
        print(f"Error updating cotisation: {e}")
        return None

def supprimer_cotisation(cotisation):
    """Deletes a cotisation."""
    try:
        db.session.delete(cotisation)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting cotisation: {e}")
        return False

def ajouter_membre_cotisation(cotisation, user_id):
    """Adds a user to a cotisation."""
    try:
        user = db.session.get(Utilisateur, user_id)
        if not user or not cotisation:
            return None

        # Check if already a member
        link = AssociationCotisationUtilisateur.query.filter_by(
            utilisateur_id=user_id,
            cotisation_id=cotisation.id
        ).first()

        if link:
            return link

        link = AssociationCotisationUtilisateur(utilisateur_id=user.id, cotisation=cotisation)
        db.session.add(link)
        db.session.commit()
        return link
    except Exception as e:
        db.session.rollback()
        print(f"Error adding member to cotisation: {e}")
        return None

def supprimer_membre_cotisation(cotisation, user_id):
    """Removes a user from a cotisation."""
    try:
        link = AssociationCotisationUtilisateur.query.filter_by(
            utilisateur_id=user_id,
            cotisation_id=cotisation.id
        ).first()

        if not link:
            return False

        db.session.delete(link)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error removing member from cotisation: {e}")
        return False


def est_cotisant_asso(utilisateur_id, association_id):
    active_cotisation = cotisations_actives_asso(association_id)
    if not active_cotisation:
        return False

    active_cotisation_ids = [c.id for c in active_cotisation]
    est_cotisant = AssociationCotisationUtilisateur.query.filter(
        AssociationCotisationUtilisateur.utilisateur_id == utilisateur_id,
        AssociationCotisationUtilisateur.cotisation_id.in_(active_cotisation_ids)
    ).first() is not None

    return est_cotisant

def set_cotisation_asso(utilisateur_id, association_id: int, est_cotisant: bool):
    cotisant_actuel = est_cotisant_asso(utilisateur_id, association_id)
    # Si l'etat est deja bon
    if (cotisant_actuel and est_cotisant) or (not cotisant_actuel and not est_cotisant):
        return

    asso = Association.query.get(association_id)
    if not asso:
        return

    active_cotisations = cotisations_actives_asso(association_id)
    if not active_cotisations:
        return
    premiere_cotisation = active_cotisations[0]

    if est_cotisant: # Si on veux ajouter une cotisation
        cotiz = AssociationCotisationUtilisateur(utilisateur_id=utilisateur_id, cotisation=premiere_cotisation)
        db.session.add(cotiz)
    else: # Si on veut ajouter une cotisation
        cotiz = AssociationCotisationUtilisateur.query.filter_by(
            utilisateur_id=utilisateur_id,
            cotisation_id=premiere_cotisation.id
        ).first()
        if cotiz:
            db.session.delete(cotiz)
    db.session.commit()

def toggle_cotisation_octo(utilisateur_id):
    asso = Association.query.filter_by(nom="Octo").first()
    if asso:
        set_cotisation_asso(utilisateur_id, asso.id, not est_cotisant_octo(utilisateur_id))

def toggle_cotisation_biero(utilisateur_id):
    asso = Association.query.filter_by(nom="Biéro").first()
    if asso:
        set_cotisation_asso(utilisateur_id, asso.id, not est_cotisant_biero(utilisateur_id))

def est_cotisant_octo(utilisateur_id):
    asso = Association.query.filter_by(nom="Octo").first()
    if asso:
        return est_cotisant_asso(utilisateur_id, asso.id)

def est_cotisant_biero(utilisateur_id):
    asso = Association.query.filter_by(nom="Biéro").first()
    if asso:
        return est_cotisant_asso(utilisateur_id, asso.id)