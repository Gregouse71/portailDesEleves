# decorators.py
# Contient les decorateurs personnalises pour s'assurer que les permissions sont respectees

from functools import wraps
from flask import jsonify, abort
from flask_login import current_user

from app.services.services_login import has_permission

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

def est_membre_de_asso(f):
    """
    l'id de l'asso doit apparaitre dans l'URL sous le nom association_id
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        association_id = kwargs.get("association_id")
        if not association_id:
            return jsonify({"message": "l'URL doit contenir l'id de l'association."}), 400
        is_membre = any(role.mandat.association_id == association_id for role in current_user.associations)
        if current_user.est_superutilisateur or is_membre:
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
