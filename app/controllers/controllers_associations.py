from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from datetime import datetime
import os

from app import db
from app.utils.decorators import est_membre_de_asso, superutilisateur_required, a_permission
from app.services.services_utilisateurs import get_utilisateur
from app.services.services_associations import add_member, remove_member, get_association, add_mandat, get_mandat, del_mandat, modifier_mandat, update_member_role, update_member_position

from app.models.models_associations import Association

# TO DO :
#
# - Uniformiser la mise a jour avec le .update
# - Ajouter des verifications de format dans cette fonction
# - Ajouter de la securite
# - enlèver association en debut de requetes et changer api.js

# Creer le blueprint pour les utilisateurs
controllers_associations = Blueprint('controllers_associations', __name__)

# routes API : /!\ AVANT DEPLOIEMENT : ajouter la securite


@controllers_associations.route("/<int:association_id>/editer_modules", methods=['PATCH'])
@login_required
@est_membre_de_asso
def route_editer_modules(association_id: int):
    """
    Modifie les modules d'une asso
    """
    try:
        new_modules = request.json.get("modules")
        asso = db.session.get(Association, association_id)
        asso.modules = new_modules
        db.session.commit()
        return jsonify({"message": "modules modifiés avec succès"}), 200
    except Exception as e:
        return jsonify({"message": f"echec dans la modification des modules : {e}"}), 500


@controllers_associations.route("/<int:association_id>/editer_description", methods=['PATCH'])
@login_required
@est_membre_de_asso
def route_editer_description(association_id: int):
    """
    Modifie la description d'une asso
    """
    try:
        new_desc = request.json.get("new_desc")
        asso = db.session.get(Association, association_id)
        asso.update(description=new_desc)
        db.session.commit()
        return jsonify({"message": "description modifiee avec succes"}), 200
    except Exception as e:
        return jsonify({"message": f"echec dans la modification de la description : {e}"}), 500


@controllers_associations.route("/<int:association_id>/modifier_ordre_importance", methods=['PATCH'])
@login_required
@superutilisateur_required
def route_modifier_ordre_importance(association_id: int):
    """
    Modifie l'ordre d'importance d'une asso
    """
    try:
        new_ordre = request.json.get("ordre_importance")
        asso = db.session.get(Association, association_id)
        asso.ordre_importance = int(new_ordre)
        db.session.commit()
        return jsonify({"message": "Ordre d'importance modifié avec succès"}), 200
    except Exception as e:
        return jsonify({"message": f"Echec dans la modification de l'ordre d'importance : {e}"}), 500


@controllers_associations.route("/<int:association_id>/modifier_nom", methods=['PATCH'])
@login_required
@superutilisateur_required
def route_modifier_nom(association_id: int):
    """
    Modifie le nom d'une asso
    """
    try:
        new_nom = request.json.get("nom")
        asso = db.session.get(Association, association_id)
        asso.nom = new_nom
        db.session.commit()
        return jsonify({"message": "Nom modifié avec succès"}), 200
    except Exception as e:
        return jsonify({"message": f"Echec dans la modification du nom : {e}"}), 500


@controllers_associations.route('/<int:association_id>/ajouter_membre/<int:mandat_id>/<int:nouveau_membre_id>', methods=['POST'])
@login_required
@est_membre_de_asso
def route_ajouter_membre(association_id, mandat_id, nouveau_membre_id):
    """
    Ajoute un membre a l'association
    """
    association = get_association(association_id)

    if not association:
        return jsonify({"message": "Association non trouvee"}), 404

    nouveau_membre = get_utilisateur(nouveau_membre_id)
    if not nouveau_membre:
        return jsonify({"message": "Utilisateur non trouve"}), 404

    mandat = get_mandat(mandat_id)
    if not mandat:
        return jsonify({"message": "Mandat non trouve"}), 404

    try:
        add_member(mandat, nouveau_membre, "membre")
        return jsonify({"message": "Membre ajoute avec succes"}), 200

    except Exception as e:
        return jsonify({"message": f"Erreur lors de l'ajout du membre : {str(e)}"}), 500


@controllers_associations.route('/<int:association_id>/ajouter_mandat/<string:nom>', methods=['POST'])
@login_required
@est_membre_de_asso
def route_ajouter_mandat(association_id, nom):
    """
    Ajoute un membre a l'association
    """
    association = get_association(association_id)

    if not association:
        return jsonify({"message": "Association non trouvee"}), 404
    
    position = request.json.get('position')

    if add_mandat(association, nom, position):
        return jsonify({"message": "Mandat créé avec succes"}), 200
    else:
        return jsonify({"message": "Impossible de créer le mandat"}), 400


@controllers_associations.route('/<int:association_id>/modifier_mandat/<int:mandat_id>', methods=['PATCH'])
@login_required
@est_membre_de_asso
def route_modifier_mandat(association_id, mandat_id):
    mandat = get_mandat(mandat_id)
    if not mandat or mandat.association_id != association_id:
        return jsonify({"message": "Mandat non trouve"}), 404

    try:
        nom = request.json.get('nom')
        pos = request.json.get('position')
        actuel = request.json.get('actuel')
        modifier_mandat(mandat, nom, pos, actuel) # This function needs to be created in services
        return jsonify({"message": "Nom du mandat modifie avec succes"}), 200
    except Exception as e:
        return jsonify({"message": f"Erreur lors de la modification du nom du mandat : {str(e)}"}), 500


@controllers_associations.route('/<int:association_id>/supprimer_mandat/<int:mandat_id>', methods=['POST'])
@login_required
@est_membre_de_asso
def route_supprimer_mandat(association_id: int, mandat_id: int):
    """
    Ajoute un membre a l'association
    """
    mandat = get_mandat(mandat_id)

    if not mandat:
        return jsonify({"message": "Mandat non trouvee"}), 404
    if del_mandat(mandat):
        return jsonify({"message": "Mandat supprimé avec succes"}), 200
    else:
        return jsonify({"message": "Impossible de supprimer le mandat"}), 400


@controllers_associations.route('/<int:association_id>/retirer_membre/<int:mandat_id>/<int:membre_id>', methods=['DELETE'])
@login_required
@est_membre_de_asso
def route_retirer_membre(association_id, mandat_id, membre_id):
    """
    Retire un membre de l'association
    """
    association = get_association(association_id)

    if not association:
        return jsonify({"message": "Association non trouvee"}), 404

    membre = get_utilisateur(membre_id)
    if not membre:
        return jsonify({"message": "Utilisateur non trouve"}), 404

    mandat = get_mandat(mandat_id)
    if not mandat:
        return jsonify({"message": "Mandat non trouve"}), 404

    try:
        remove_member(mandat, membre)
        return jsonify({"message": "Membre retire avec succes"}), 200

    except Exception as e:
        return jsonify({"message": f"Erreur lors du retrait du membre : {str(e)}"}), 500


@controllers_associations.route('/<int:association_id>/modifier_role_membre/<int:mandat_id>/<int:membre_id>', methods=['PATCH'])
@login_required
@est_membre_de_asso
def route_modifier_role_membre(association_id, mandat_id, membre_id):
    """
    Modifie le role d'un membre de l'association
    """
    mandat = get_mandat(mandat_id)
    if not mandat or mandat.association_id != association_id:
        return jsonify({"message": "Mandat non trouve"}), 404

    membre = get_utilisateur(membre_id)
    if not membre:
        return jsonify({"message": "Utilisateur non trouve"}), 404

    try:
        role = request.json.get('role')
        update_member_role(mandat, membre, role)
        return jsonify({"message": "Role du membre modifie avec succes"}), 200

    except Exception as e:
        return jsonify({"message": f"Erreur lors de la modification du role du membre : {str(e)}"}), 500


@controllers_associations.route('/<int:association_id>/modifier_position_membre/<int:mandat_id>/<int:membre_id>', methods=['PATCH'])
@login_required
@est_membre_de_asso
def route_modifier_position_membre(association_id, mandat_id, membre_id):
    """
    Modifie la position d'affichage du membre
    """
    mandat = get_mandat(mandat_id)
    if not mandat or mandat.association_id != association_id:
        return jsonify({"message": "Mandat non trouve"}), 404

    membre = get_utilisateur(membre_id)
    if not membre:
        return jsonify({"message": "Utilisateur non trouve"}), 404

    try:
        new_position = request.json.get('position')
        update_member_position(mandat, membre, new_position)
        return jsonify({"message": "Position du membre modifie avec succes"}), 200

    except Exception as e:
        return jsonify({"message": f"Erreur lors de la modification de la position du membre : {str(e)}"}), 500


@controllers_associations.route('/<int:association_id>/modifier_logo_banniere/<string:logo_banniere>/<path:new_path>', methods=['POST'])
@login_required
@est_membre_de_asso
def route_modifier_logo_banniere(association_id: int, logo_banniere: str, new_path: str):
    """
    Modifie la bannière de l'association
    """
    association = db.session.get(Association, association_id)
    if logo_banniere == 'logo':
        association.logo_path = new_path
        db.session.commit()
        return jsonify({"message": "logo modifie avec succes"}), 200
    elif logo_banniere == 'banniere':
        association.banniere_path = new_path
        db.session.commit()
        return jsonify({"message": "banniere modifie avec succes"}), 200
    else:
        return jsonify({"message": "erreur : veulliez entrer logo/new_logo_path ou banner/new_banner_path"}), 404


# AJOUTER DE LA SECURITE
@controllers_associations.route('/<int:association_id>/add_content', methods=['POST'])
@login_required
@est_membre_de_asso
def route_add_content(association_id):
    """
    Ajoute du contenu au dossier de l'association
    """
    asso = get_association(association_id)
    if not asso:
        return jsonify({"success": False, "message": "Association introuvable"}), 404
    # Définition du dossier d'upload
    UPLOAD_FOLDER = os.path.join('upload', 'associations', asso.nom_dossier)
    ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}
    # Vérifier si un fichier a été envoyé
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Aucun fichier reçu"}), 400
    file = request.files['file']
    # Vérifier si l'extension du fichier est autorisée
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        return jsonify({"success": False, "message": "Extension de fichier non autorisée"}), 400
    # Vérifier si le dossier d'upload existe, sinon le créer
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{name}_{timestamp}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)
    return jsonify({"success": True, "message": "Fichier ajouté avec succès", "file_name": filename}), 200


@controllers_associations.route('/route_creer_asso', methods=["POST"])
@login_required
@superutilisateur_required
def route_creer_asso():
    """
    Crée l'asso
    """
    try:
        data = request.json
        nouvelle_asso = Association(
            nom=data["nom"], description=data['description'], type_association=data["type_association"],
            ordre_importance=data["ordre_importance"], logo_path=data["logo_path"],
            banniere_path=data["banniere_path"], a_cacher_aux_nouveaux=data["a_cacher_aux_nouveaux"]
        )
        nouvelle_asso.create_association_folder()
        db.session.add(nouvelle_asso)
        db.session.commit()
        return jsonify({"message": "association ajoutee avec succes"}), 201
    except Exception as e:
        return jsonify({"message": f"erreur lors de l'ajout de l'association : {e}"}), 500


@controllers_associations.route('/assos', methods=['GET'])
@login_required
def route_get_assos():
    if current_user.est_baptise or current_user.est_superutilisateur:
        assos = Association.query.all()
    else:
        assos = Association.query.filter_by(a_cacher_aux_nouveaux=False).all()

    return jsonify([{"id": asso.id, "ordre_importance": asso.ordre_importance} for asso in assos])


@controllers_associations.route('/<int:association_id>', methods=['GET'])
@login_required
@a_permission("octo")
def route_get_asso(association_id):
    if current_user.est_baptise or current_user.est_superutilisateur:
        asso = Association.query.filter_by(id=association_id).first()
    else:
        asso = Association.query.filter_by(a_cacher_aux_nouveaux=False, id=association_id).first()

    if not asso:
        return jsonify({"error": "Association not found"}), 404

    return jsonify(asso.to_dict())


@controllers_associations.route("route_est_membre_de_asso/<int:id_association>", methods=["GET"])
@login_required
def route_est_membre_de_asso(id_association: int):
    try:
        is_membre = any(role.mandat.association_id == id_association for role in current_user.associations)
        autorise = is_membre or current_user.est_superutilisateur
        return jsonify({"is_membre": is_membre, "autorise": autorise}), 200
    except Exception as e:
        return jsonify({"Erreur": str(e)}), 400
