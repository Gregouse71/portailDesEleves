# decorators.py
# Contient les decorateurs personnalises pour s'assurer que les permissions sont respectees

from functools import wraps
from flask import jsonify, abort
from flask_login import current_user

from app.services.services_login import has_permission
from app.models.models_associations import AssociationMandat
from app.services.services_associations import is_admin_asso

# a utiliser en plus de @login_required, on ne verifie pas ici l'authentification
# le superutilisateur a tous les droits

def superutilisateur_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_user.est_superutilisateur:
            return f(*args, **kwargs)
        else :
            return jsonify({"message": "Vous devez etre un superutilisateur pour effectuer cette action"}), 403
    return decorated_function


def est_membre_de_asso(f=None, mandat=False, actuel=False, admin=False):
    """
    L'id de l'asso doit apparaitre dans l'URL sous le nom *association_id*

    L'utilisateur doit être membre de l'asso pour réaliser cette action.

    Si *mandat* == True, l'utilisateur doit aussi être membre du mandat cible
    (dont l'id apparaît dans l'URL), ou du mandat principal de l'association,
    ou du mandat avec le rang le plus élevé.
    Dans ce cas l'id du mandat doit apparaitre dans l'URL sous le nom *mandat_id*

    Si *actuel* == True, l'utilisateur doit être un membre du mandat principal
    ou du mandat avec le rang le plus élevé de l'association.
    """
    if f is None:
        def decorator(func):
            return est_membre_de_asso(func, mandat=mandat, actuel=actuel, admin=admin)
        return decorator

    @wraps(f)
    def decorated_function(*args, **kwargs):
        association_id = kwargs.get("association_id")
        if association_id is None:
            return jsonify({"message": "l'URL doit contenir l'id de l'association."}), 400

        if current_user.est_superutilisateur: # Superutilisateur OK
            return f(*args, **kwargs)

        user_roles_in_asso = [role for role in current_user.associations if role.mandat.association_id == association_id]
        if not user_roles_in_asso:
            return jsonify({"message": "Vous n'avez pas les permissions pour effectuer cette action"}), 403

        if not (mandat or actuel or admin): # Membre quelconque OK si mandat==False et actuel==False
            return f(*args, **kwargs)

        mandats_asso = AssociationMandat.query.filter_by(association_id=association_id).all()
        if mandats_asso:
            max_position = max(m.position for m in mandats_asso)
            is_membre_actuel = any(role.mandat.actuel for role in user_roles_in_asso)
            is_membre_max = any(role.mandat.position == max_position for role in user_roles_in_asso)
            is_admin = is_admin_asso(current_user, association_id)
            if is_membre_actuel or is_membre_max or is_admin: # Membre actuel/max/admin OK
                return f(*args, **kwargs)

        if mandat:
            mandat_id = kwargs.get("mandat_id")
            if mandat_id is None:
                return jsonify({"message": "l'URL doit contenir l'id du mandat."}), 400

            is_membre_mandat = any(role.mandat.id == mandat_id for role in user_roles_in_asso)
            if is_membre_mandat:
                return f(*args, **kwargs)

        return jsonify({"message": "Vous n'avez pas les permissions pour effectuer cette action"}), 403
    return decorated_function


def a_permission(*args1):
    """
    Vérifie que l'utilisateur qui fait la requete a au moins une des permissions
    """
    def decorated_function(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if current_user.est_superutilisateur:
                return f(*args, **kwargs)

            if any([has_permission(current_user, perm) for perm in args1]):
                return f(*args, **kwargs)
            abort(403)
        return wrapper
    return decorated_function
