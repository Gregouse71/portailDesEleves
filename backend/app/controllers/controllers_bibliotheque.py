from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.models import Utilisateur
from app.models.models_bibliotheque import Livre
from app.services.services_bibliotheque import (
    liste_des_livres, ajouter_nouveau_livre, supprimer_livre,
    emprunter_livre, retourner_livre, liste_emprunts, importer_livres_excel,
)
from app.utils.decorators import a_permission

controllers_bibliotheque = Blueprint('controllers_bibliotheque', __name__)


@controllers_bibliotheque.get('/<int:asso_id>/livres')
@login_required
def get_livres(asso_id: int):
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    query = request.args.get("query", "")
    serie = request.args.get("serie")
    order_by = request.args.get("order_by", "serie")
    order_asc = request.args.get("order_asc", "true").lower() == "true"

    disponible_arg = request.args.get("disponible")
    disponible = disponible_arg.lower() == "true" if disponible_arg is not None else None

    return jsonify(liste_des_livres(asso_id, page, per_page, query, serie, disponible, order_by, order_asc))


@controllers_bibliotheque.post('/<int:asso_id>/livres')
@login_required
def post_livre(asso_id: int):
    data = request.json
    if not data.get("serie"):
        return jsonify({"message": "La série est obligatoire"}), 400

    livre = ajouter_nouveau_livre(
        asso_id=asso_id,
        serie=data["serie"],
        auteur=data.get("auteur"),
        edition=data.get("edition"),
        tome=data.get("tome"),
        reference=data.get("reference"),
        etat=data.get("etat"),
    )
    return jsonify(livre)


@controllers_bibliotheque.post('/<int:asso_id>/livres/import')
@login_required
def post_import_livres(asso_id: int):
    fichier = request.files.get("fichier")
    if not fichier:
        return jsonify({"message": "Aucun fichier fourni"}), 400

    try:
        resultat = importer_livres_excel(asso_id, fichier)
    except Exception as e:
        return jsonify({"message": f"Erreur lors de la lecture du fichier : {e}"}), 400

    return jsonify(resultat)


@controllers_bibliotheque.put('/<int:asso_id>/livres/<int:livre_id>')
@login_required
def put_livre(asso_id: int, livre_id: int):
    livre = Livre.query.filter_by(id=livre_id, asso_id=asso_id).first()
    if not livre:
        return jsonify({"message": "Livre introuvable"}), 404

    livre.patch(request.json)
    return jsonify(livre.to_dict())


@controllers_bibliotheque.delete('/<int:asso_id>/livres/<int:livre_id>')
@login_required
def delete_livre(asso_id: int, livre_id: int):
    resultat = supprimer_livre(asso_id, livre_id)
    if resultat is None:
        return jsonify({"message": "Livre introuvable"}), 404
    if resultat is False:
        return jsonify({"message": "Impossible de supprimer un livre actuellement emprunte"}), 400

    return jsonify({"success": True})


@controllers_bibliotheque.post('/<int:asso_id>/emprunter')
@login_required
def post_emprunter(asso_id: int):
    data = request.json
    livre = Livre.query.filter_by(id=data.get("livre_id"), asso_id=asso_id).first()
    utilisateur = Utilisateur.query.get(data.get("utilisateur_id"))
    if not livre or not utilisateur:
        return jsonify({"message": "Livre ou utilisateur introuvable"}), 404

    resultat = emprunter_livre(livre, utilisateur, current_user)
    if resultat is None:
        return jsonify({"message": "Ce livre n'est pas disponible"}), 400

    return jsonify(resultat)


@controllers_bibliotheque.post('/<int:asso_id>/retourner')
@login_required
def post_retourner(asso_id: int):
    data = request.json
    livre = Livre.query.filter_by(id=data.get("livre_id"), asso_id=asso_id).first()
    if not livre:
        return jsonify({"message": "Livre introuvable"}), 404

    resultat = retourner_livre(livre, current_user)
    if resultat is None:
        return jsonify({"message": "Ce livre n'est pas actuellement emprunte"}), 400

    return jsonify(resultat)


@controllers_bibliotheque.get('/<int:asso_id>/emprunts')
@login_required
def get_emprunts(asso_id: int):
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    utilisateur_id = request.args.get("utilisateur_id", type=int)
    en_cours_seulement = request.args.get("en_cours_seulement", "false").lower() == "true"

    return jsonify(liste_emprunts(asso_id, page, per_page, utilisateur_id, en_cours_seulement))