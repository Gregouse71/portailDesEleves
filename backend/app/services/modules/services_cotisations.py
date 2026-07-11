from datetime import datetime
from app import db
from app.models.models_associations import Association
from app.models.models_utilisateurs import Utilisateur
from app.models.modules.models_cotisations import AssociationCotisation, AssociationCotisationUtilisateur

def get_cotisations_for_association(association_id):
    """Gets all cotisations for a given association."""
    return AssociationCotisation.query.filter_by(association_id=association_id).all()

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

        link = AssociationCotisationUtilisateur(utilisateur=user, cotisation=cotisation)
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
