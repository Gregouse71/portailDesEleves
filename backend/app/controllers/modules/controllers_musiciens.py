# app/controllers/modules/controllers_musiciens.py
from flask import Blueprint, request, jsonify
from flask_login import login_required

from app.services.modules.services_musiciens import get_musiciens_for_association

controllers_musiciens = Blueprint('controllers_musiciens', __name__)


@controllers_musiciens.get('/<int:association_id>')
@login_required
def route_get_musiciens(association_id: int):
    """
    Récupère la liste des musiciens pour une association.
    Paramètres optionnels dans la requête :
    - instrument : nom d'instrument recherché
    - search : texte recherché dans le prénom, nom ou nom_utilisateur
    - niveau : niveau recherché
    """
    instrument = request.args.get('instrument', None)
    search = request.args.get('search', None)
    niveau = request.args.get('niveau', None)

    data, error, status_code = get_musiciens_for_association(
        association_id=association_id,
        instrument=instrument,
        search=search,
        niveau=niveau
    )

    if error:
        return jsonify({"message": error}), status_code

    return jsonify(data), 200

