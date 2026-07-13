from flask import Blueprint, request, jsonify, abort, send_file
from flask_login import login_required
import csv
import io

from app import db
from app.models.modules.models_cotisations import AssociationCotisation
from app.services.modules.services_cotisations import (
    get_cotisations_for_association,
    creer_cotisation,
    patch_cotisation,
    supprimer_cotisation,
    ajouter_membre_cotisation,
    supprimer_membre_cotisation
)
from app.utils.decorators import est_membre_de_asso

controllers_cotisations = Blueprint('controllers_cotisations', __name__)

@controllers_cotisations.get('/<int:association_id>/cotisations')
@login_required
def route_get_cotisations(association_id):
    """Gets all cotisations for a given association."""
    cotisations = get_cotisations_for_association(association_id)
    return jsonify([c.to_dict() for c in cotisations]), 200

@controllers_cotisations.post('/<int:association_id>/cotisation')
@login_required
@est_membre_de_asso(admin=True)
def route_add_cotisation(association_id):
    """Creates a new cotisation."""
    data = request.get_json()
    if not data or not data.get('nom') or not data.get('date_debut') or not data.get('date_fin'):
        return jsonify({"success": False, "message": "Champs obligatoires manquants."}), 400

    new_cot = creer_cotisation(association_id, data)
    if new_cot:
        return jsonify({"success": True, "cotisation": new_cot.to_dict()}), 201
    return jsonify({"success": False, "message": "Erreur lors de la création de la cotisation."}), 500

@controllers_cotisations.put('/<int:association_id>/cotisation/<int:cotisation_id>')
@login_required
@est_membre_de_asso(admin=True)
def route_update_cotisation(association_id, cotisation_id):
    """Updates an existing cotisation."""
    data = request.get_json()
    cot = db.session.get(AssociationCotisation, cotisation_id)
    if not cot or cot.association_id != association_id:
        return jsonify({"success": False, "message": "Cotisation introuvable."}), 404

    updated_cot = patch_cotisation(cot, data)
    if updated_cot:
        return jsonify({"success": True, "cotisation": updated_cot.to_dict()}), 200
    return jsonify({"success": False, "message": "Erreur lors de la mise à jour de la cotisation."}), 500

@controllers_cotisations.delete('/<int:association_id>/cotisation/<int:cotisation_id>')
@login_required
@est_membre_de_asso(admin=True)
def route_delete_cotisation(association_id, cotisation_id):
    """Deletes a cotisation."""
    cot = db.session.get(AssociationCotisation, cotisation_id)
    if not cot or cot.association_id != association_id:
        return jsonify({"success": False, "message": "Cotisation introuvable."}), 404

    if supprimer_cotisation(cot):
        return jsonify({"success": True, "message": "Cotisation supprimée avec succès."}), 200
    return jsonify({"success": False, "message": "Erreur lors de la suppression."}), 500

@controllers_cotisations.post('/<int:association_id>/cotisation/<int:cotisation_id>/membres')
@login_required
@est_membre_de_asso(admin=True)
def route_add_membre(association_id, cotisation_id):
    """Adds a user to a cotisation."""
    data = request.get_json()
    user_id = data.get('utilisateur_id')
    if not user_id:
        return jsonify({"success": False, "message": "utilisateur_id requis."}), 400

    cot = db.session.get(AssociationCotisation, cotisation_id)
    if not cot or cot.association_id != association_id:
        return jsonify({"success": False, "message": "Cotisation introuvable."}), 404

    link = ajouter_membre_cotisation(cot, user_id)
    if link:
        return jsonify({"success": True, "membre": link.to_dict()}), 201
    return jsonify({"success": False, "message": "Erreur lors de l'ajout du membre."}), 500

@controllers_cotisations.delete('/<int:association_id>/cotisation/<int:cotisation_id>/membres/<int:user_id>')
@login_required
@est_membre_de_asso(admin=True)
def route_delete_membre(association_id, cotisation_id, user_id):
    """Removes a user from a cotisation."""
    cot = db.session.get(AssociationCotisation, cotisation_id)
    if not cot or cot.association_id != association_id:
        return jsonify({"success": False, "message": "Cotisation introuvable."}), 404

    if supprimer_membre_cotisation(cot, user_id):
        return jsonify({"success": True, "message": "Membre retiré avec succès."}), 200
    return jsonify({"success": False, "message": "Erreur lors du retrait du membre."}), 500

@controllers_cotisations.get('/<int:association_id>/cotisation/<int:cotisation_id>/export')
@login_required
@est_membre_de_asso(admin=True)
def route_export_csv(association_id, cotisation_id):
    """Exports cotisants to a CSV file."""
    cot = db.session.get(AssociationCotisation, cotisation_id)
    if not cot or cot.association_id != association_id:
        return abort(404)

    proxy = io.StringIO()
    fieldnames = ["id", "nom_utilisateur", "prenom", "nom", "promotion", "email", "cycle"]
    writer = csv.DictWriter(proxy, fieldnames=fieldnames)
    writer.writeheader()

    for link in cot.membres:
        user = link.utilisateur
        if user:
            writer.writerow({
                "id": user.id,
                "nom_utilisateur": user.nom_utilisateur,
                "prenom": user.prenom,
                "nom": user.nom,
                "promotion": user.promotion,
                "email": user.email,
                "cycle": user.cycle
            })

    proxy.seek(0)
    mem = io.BytesIO()
    mem.write(proxy.getvalue().encode('utf-8'))
    mem.seek(0)
    proxy.close()

    return send_file(
        mem,
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'cotisants_{cot.nom}.csv'
    )
