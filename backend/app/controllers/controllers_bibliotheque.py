from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app.models import Utilisateur
from app.models.models_bibliotheque import Livre
from app.services.services_bibliotheque import (
    liste_des_livres, ajouter_nouveau_livre, supprimer_livre,
    emprunter_livre, retourner_livre, liste_emprunts,
)
from app.utils.decorators import a_permission

controllers_bibliotheque = Blueprint('controllers_bibliotheque', __name__)


@controllers_bibliotheque.get('/livres')
@login_required
def get_livres():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    query = request.args.get("query", "")
    serie = request.args.get("serie")
    order_by = request.args.get("order_by", "serie")
    order_asc = request.args.get("order_asc", "true").lower() == "true"

    disponible_arg = request.args.get("disponible")
    disponible = disponible_arg.lower() == "true" if disponible_arg is not None else None

    return jsonify(liste_des_livres(page, per_page, query, serie, disponible, order_by, order_asc))


@controllers_bibliotheque.post('/livres')
@login_required
@a_permission("admin_biblio")
def post_livre():
    data = request.json
    if not data.get("serie"):
        return jsonify({"message": "La série est obligatoire"}), 400

    livre = ajouter_nouveau_livre(
        serie=data["serie"],
        auteur=data.get("auteur"),
        edition=data.get("edition"),
        tome=data.get("tome"),
        reference=data.get("reference"),
        etat=data.get("etat"),
    )
    return jsonify(livre)


@controllers_bibliotheque.put('/livres/<int:livre_id>')
@login_required
@a_permission("admin_biblio")
def put_livre(livre_id: int):
    livre = Livre.query.get(livre_id)
    if not livre:
        return jsonify({"message": "Livre introuvable"}), 404

    livre.patch(request.json)
    return jsonify(livre.to_dict())


@controllers_bibliotheque.delete('/livres/<int:livre_id>')
@login_required
@a_permission("admin_biblio")
def delete_livre(livre_id: int):
    resultat = supprimer_livre(livre_id)
    if resultat is None:
        return jsonify({"message": "Livre introuvable"}), 404
    if resultat is False:
        return jsonify({"message": "Impossible de supprimer un livre actuellement emprunte"}), 400

    return jsonify({"success": True})


@controllers_bibliotheque.post('/emprunter')
@login_required
@a_permission("admin_biblio")
def post_emprunter():
    data = request.json
    livre = Livre.query.get(data.get("livre_id"))
    utilisateur = Utilisateur.query.get(data.get("utilisateur_id"))
    if not livre or not utilisateur:
        return jsonify({"message": "Livre ou utilisateur introuvable"}), 404

    resultat = emprunter_livre(livre, utilisateur, current_user)
    if resultat is None:
        return jsonify({"message": "Ce livre n'est pas disponible"}), 400

    return jsonify(resultat)


@controllers_bibliotheque.post('/retourner')
@login_required
@a_permission("admin_biblio")
def post_retourner():
    data = request.json
    livre = Livre.query.get(data.get("livre_id"))
    if not livre:
        return jsonify({"message": "Livre introuvable"}), 404

    resultat = retourner_livre(livre, current_user)
    if resultat is None:
        return jsonify({"message": "Ce livre n'est pas actuellement emprunte"}), 400

    return jsonify(resultat)


@controllers_bibliotheque.get('/emprunts')
@login_required
@a_permission("admin_biblio")
def get_emprunts():
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 20))
    utilisateur_id = request.args.get("utilisateur_id", type=int)
    en_cours_seulement = request.args.get("en_cours_seulement", "false").lower() == "true"

    return jsonify(liste_emprunts(page, per_page, utilisateur_id, en_cours_seulement))