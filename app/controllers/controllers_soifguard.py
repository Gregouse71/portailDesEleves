from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user

from app import db
from app.models import Utilisateur, ConsoSoifguard, PermissionSoifguard
from app.services.services_soifguard import encaisser_utilisateur, crediter_utilisateur, fixer_negatif_maximum, ajouter_nouvelle_conso, supprimer_conso, modifier_conso, liste_des_consos, liste_operations
from app.services.services_global import get_global_var
from app.utils.decorators import superutilisateur_required, a_permission

# Creer le blueprint pour soifguard
controllers_soifguard = Blueprint('controllers_soifguard', __name__)

@controllers_soifguard.route('/get_permissions_soifguard', methods=['GET'])
@login_required
@superutilisateur_required
def get_permissions_soifguard():
    # Récupérer toutes les permissions
    permissions = PermissionSoifguard.query.all()
    # Créer un dictionnaire pour regrouper les utilisateurs par id
    utilisateurs_permissions = {}
    for permission in permissions:
        utilisateur = Utilisateur.query.get(permission.id_utilisateur)
        if utilisateur:
            if utilisateur.id not in utilisateurs_permissions:
                utilisateurs_permissions[utilisateur.id] = {
                    'nom_utilisateur': utilisateur.nom_utilisateur,
                    'assos': set()  # Utilisation d'un set pour éviter les doublons
                }
            # Ajouter l'association ('octo', 'biero') à l'utilisateur
            utilisateurs_permissions[utilisateur.id]['assos'].add(permission.asso)
    # Structurer la réponse
    result = []
    for user_id, data in utilisateurs_permissions.items():
        assos = ', '.join(data['assos'])  # Convertir le set en chaîne de caractères
        result.append({
            'nom_utilisateur': data['nom_utilisateur'],
            'assos': assos
        })
    return jsonify(result)

@controllers_soifguard.route('/ajouter_permission', methods=['POST'])
@login_required
@superutilisateur_required
def ajouter_permission():
    """
    Ajoute une permission Soifguard pour un utilisateur.
    """
    data = request.json
    id_utilisateur = int(data.get("id_utilisateur"))
    asso = data.get("asso", "octo")  # Par défaut, "octo"
    if not id_utilisateur:
        return jsonify({"success": False, "message": "ID utilisateur requis"}), 400
    if asso not in ["octo", "biero"]:
        return jsonify({"success": False, "message": "Association invalide"}), 400
    # Vérifie si l'utilisateur a déjà la permission
    permission_existante = PermissionSoifguard.query.filter_by(id_utilisateur=id_utilisateur, asso=asso).first()
    if permission_existante:
        return jsonify({"success": False, "message": "L'utilisateur a déjà cette permission"}), 400
    # Ajoute la permission
    nouvelle_permission = PermissionSoifguard(id_utilisateur=id_utilisateur, asso=asso)
    db.session.add(nouvelle_permission)
    db.session.commit()
    return jsonify({"success": True, "message": f"Permission '{asso}' ajoutée à l'utilisateur {id_utilisateur}."})

@controllers_soifguard.post('/encaisser/<string:asso>')
@login_required
@a_permission("octo", "biero")
def encaisser_octo(asso: str):
    """
    Quand on consomme
    """
    data = request.json
    utilisateur = Utilisateur.query.get(data['id_utilisateur'])
    conso = ConsoSoifguard.query.get(data['id_conso'])
    if not utilisateur or not conso:
        return jsonify({"message": "Utilisateur ou conso introuvable"}), 404

    if conso.asso == "octo" or conso.asso == "biero":
        return jsonify(encaisser_utilisateur(utilisateur, current_user, conso))

    return jsonify({"message": "Asso invalide"}), 400

@controllers_soifguard.post('/crediter/<string:asso>')
@login_required
@a_permission("octo", "biero")
def crediter_octo(asso: str):
    """
    Quand on mets de l'argent sur le compte
    """
    data = request.json
    utilisateur = Utilisateur.query.get(data['id_utilisateur'])
    if not utilisateur:
        return jsonify({"success": False, "message": "Utilisateur introuvable"}), 404
    
    return jsonify(crediter_utilisateur(utilisateur, current_user, data['somme'], asso))

@controllers_soifguard.post('/fixer_negatif_maximum/<string:asso>')
@login_required
@a_permission("octo", "biero")
def fixer_maximum(asso: str):
    data = request.json
    try:
        return jsonify(fixer_negatif_maximum(asso, data['maximum']))
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400

@controllers_soifguard.post('/conso')
@login_required
@a_permission("octo", "biero")
def post_conso():
    """
    Crée une consommation possible
    """
    data = request.json
    asso = data["asso"]
    if asso not in ["octo", "biero"]:
        return jsonify({"message": "Asso incorrecte"}), 400
    return jsonify(ajouter_nouvelle_conso(data['nom_conso'], asso, data['prix'], data.get('prix_cotisant')))

@controllers_soifguard.delete('/conso/<int:id>')
@login_required
@a_permission("octo", "biero")
def delete_conso(id: int):
    """
    Supprime une consommation
    """
    conso = ConsoSoifguard.query.get(id)
    if not conso:
        return jsonify({"success": False, "message": "Conso introuvable"}), 404
    supprimer_conso(conso)
    return jsonify(supprimer_conso(conso))

@controllers_soifguard.put('/conso/<int:id>')
@login_required
@a_permission("octo", "biero")
def put_conso(id: int):
    """
    Modifie une conso
    """
    data = request.json
    conso = ConsoSoifguard.query.get(id)
    if not conso:
        return jsonify({"success": False, "message": "Conso introuvable"}), 404

    return jsonify(modifier_conso(conso, data))

@controllers_soifguard.get('/liste_consos')
@login_required
def liste_consos():
    return jsonify(liste_des_consos())

@controllers_soifguard.route("/verifier_permission", methods=["POST"])
@login_required
def verifier_permission():
    """Verifie si l'utilisateur a les permissions pour utiliser soifguard"""
    data = request.json
    asso = data.get("asso")
    if asso not in ["octo", "biero"]:
        return jsonify({"success": False, "message": "Association invalide"}), 400
    permission = PermissionSoifguard.query.filter_by(id_utilisateur=current_user.id, asso=asso).first()
    has_permission = permission is not None or current_user.est_superutilisateur
    return jsonify({"success": True, "has_permission": has_permission}), 200

@controllers_soifguard.put('/toggle_cotisation/<int:id_utilisateur>')
@login_required
@a_permission("octo", "biero")
def switch_cotisation_octo(id_utilisateur:int) :
    """
    Rend cotisant un utilisateur non cotisant, et rend non cotisant un utilisateur cotisant
    """
    data = request.json
    asso = data.get("asso")
    utilisateur = Utilisateur.query.get(id_utilisateur)

    if asso not in ["octo", "biero"] or not utilisateur:
        return jsonify({"message":"utilisateur introuvable ou asso invalide"}), 400

    if asso == "octo":
        utilisateur.est_cotisant_octo = not utilisateur.est_cotisant_octo
    elif asso == "biero":
        utilisateur.est_cotisant_biero = not utilisateur.est_cotisant_biero
    db.session.commit()
    return jsonify(utilisateur.to_dict()), 200

@controllers_soifguard.route('/get_negatif_max/<string:asso>', methods=['GET'])
@login_required
def get_negatif_max(asso:str) :
    """
    Donne le neagtif maximal autorisé pour octo ou biero
    """
    if asso == 'octo' :
        return jsonify(get_global_var("max_negatif_octo")), 200
    elif asso == 'biero' :
        return jsonify(get_global_var("max_negatif_biero")), 200
    else :
        return jsonify({"message": "erreur : asso doit etre octo ou biero"}), 400


@controllers_soifguard.post('/operations')
@login_required
@a_permission("octo", "biero")
def get_liste_operations():
    """
    Renvoie la liste des opérations récentes
    """
    data = request.json
    page = data.get("page", 0)
    per = data.get("per", 20)
    asso = data.get("asso", "")
    query = data.get("query", "")

    return jsonify(liste_operations(asso, page=page, per=per, query=query)), 200

