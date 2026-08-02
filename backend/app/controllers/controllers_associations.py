from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import os
from datetime import datetime

from app import db
from app.utils.decorators import est_membre_de_asso, superutilisateur_required
from app.services.services_utilisateurs import get_utilisateur
from app.services.services_associations import add_member, remove_member, get_association, add_mandat, get_mandat, del_mandat, modifier_mandat, update_member, get_asso_media, is_admin_asso
from app.services.services_media import upload_media, delete_media

from app.models.models_associations import Association, AssociationMandat
from app.models.models_media import ElementMedia

# TO DO :
#
# - Uniformiser la mise a jour avec le .update
# - Ajouter des verifications de format dans cette fonction

# Creer le blueprint pour les utilisateurs
controllers_associations = Blueprint('controllers_associations', __name__)

# routes API : /!\ AVANT DEPLOIEMENT : ajouter la securite


@controllers_associations.route("/<int:association_id>/editer_modules", methods=['PATCH'])
@login_required
@superutilisateur_required
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
@est_membre_de_asso(actuel=True)
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
@est_membre_de_asso(mandat=True)
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
@est_membre_de_asso(actuel=True)
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


@controllers_associations.patch('/<int:association_id>/modifier_mandat/<int:mandat_id>')
@login_required
@est_membre_de_asso(actuel=True)
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
@est_membre_de_asso(actuel=True)
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
@est_membre_de_asso(mandat=True)
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


@controllers_associations.patch('/modifier_membre/<int:association_id>/<int:mandat_id>/<int:membre_id>')
@login_required
@est_membre_de_asso(mandat=True)
def route_modifier_role_membre(association_id, mandat_id, membre_id):
    """
    Modifie le membre de l'association
    """
    mandat = get_mandat(mandat_id)
    if not mandat or mandat.association_id != association_id:
        return jsonify({"message": "Mandat non trouve"}), 404

    membre = get_utilisateur(membre_id)
    if not membre:
        return jsonify({"message": "Utilisateur non trouve"}), 404

    try:
        role = request.json.get('role')
        position = int(request.json.get('position'))
        admin = bool(request.json.get('admin'))
        update_member(mandat, membre, role, position, admin)
        return jsonify({"message": "Role du membre modifie avec succes"}), 200

    except Exception as e:
        return jsonify({"message": f"Erreur lors de la modification du role du membre : {str(e)}"}), 500


@controllers_associations.post('/<int:association_id>/modifier_logo_banniere/<string:logo_banniere>/<int:mandat_id>/<int:new_id>')
@login_required
@est_membre_de_asso(actuel=True)
def route_modifier_logo_banniere(association_id: int, logo_banniere: str, mandat_id: int, new_id: int):
    """
    Modifie le logo ou la bannière d'un mandat.
    """
    association = db.session.get(Association, association_id)
    media = db.session.get(ElementMedia, new_id)
    mandat = db.session.get(AssociationMandat, mandat_id)
    if media is None or association is None or mandat is None:
        return jsonify({"message": "Association, mandat ou media non trouvé"}), 404
    if mandat.association_id != association_id:
        return jsonify({"message": "Le mandat n'appartient pas à cette association"}), 403

    if logo_banniere == 'logo':
        mandat.logo_id = new_id
        db.session.commit()
        return jsonify({"message": "logo modifié avec succès"}), 200
    elif logo_banniere == 'banniere':
        mandat.banniere_id = new_id
        db.session.commit()
        return jsonify({"message": "bannière modifiée avec succès"}), 200
    else:
        return jsonify({"message": "erreur : veuillez entrer logo ou banniere"}), 400


@controllers_associations.route('/<int:association_id>/upload_logo_banniere/<string:photo_type>', methods=['POST'])
@login_required
@est_membre_de_asso
def route_upload_logo_banniere(association_id: int, photo_type: str):
    """
    Téléverse et définit directement un nouveau logo ou une nouvelle bannière pour l'association.
    Nomme le fichier logo_{timestamp} ou banniere_{timestamp} et l'ajoute aux éléments media.
    """
    if photo_type not in ['logo', 'banniere']:
        return jsonify({"success": False, "message": "Type invalide (doit être logo ou banniere)"}), 400

    asso = get_association(association_id)
    if not asso:
        return jsonify({"success": False, "message": "Association introuvable"}), 404

    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Aucun fichier reçu"}), 400

    file = request.files['file']
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        return jsonify({"success": False, "message": "Extension de fichier non autorisée"}), 400

    timestamp = datetime.now().strftime("%d-%m-%Y_%H-%M-%S")
    custom_name = f"{photo_type}_{timestamp}"
    UPLOAD_FOLDER = os.path.join('associations', asso.nom_dossier)

    actuel_mandat = next((m for m in asso.mandats if m.actuel), None)
    if not actuel_mandat:
        return jsonify({"success": False, "message": "Aucun mandat actuel défini"}), 400

    media = upload_media(file, UPLOAD_FOLDER, custom_filename=custom_name, mandat_id=actuel_mandat.id)
    if not media:
        return jsonify({"success": False, "message": "Impossible de créer le fichier."}), 400

    if photo_type == 'logo':
        actuel_mandat.logo_id = media.id
    elif photo_type == 'banniere':
        actuel_mandat.banniere_id = media.id

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"{photo_type.capitalize()} modifié avec succès",
        "file_name": media.file_path,
        "media_id": media.id
    }), 200


@controllers_associations.get('/content/<int:asso_id>')
@login_required
def get_content_asso(asso_id: int):
    files = get_asso_media(asso_id)
    return jsonify(files), 200


@controllers_associations.delete('/content/<int:association_id>/<int:media_id>')
@login_required
@est_membre_de_asso(actuel=True)
def delete_content_asso(association_id: int, media_id: int):
    """
    Supprime un contenu (photo) pour un utilisateur.
    """
    media = ElementMedia.query.get(media_id)
    if media is None:
        return jsonify({"message": "Media non trouvé"}), 404


    cached_media_id = media.id

    if not delete_media(media):
        return jsonify({"message": "Media protégé"}), 400

    for u in Association.query.filter_by(banniere_id=cached_media_id).all():
        u.banniere_id = None
    for u in Association.query.filter_by(logo_id=cached_media_id).all():
        u.logo_id = None
    for m in AssociationMandat.query.filter_by(banniere_id=cached_media_id).all():
        m.banniere_id = None
    for m in AssociationMandat.query.filter_by(logo_id=cached_media_id).all():
        m.logo_id = None
    db.session.commit()

    return jsonify({"message": "Media supprimé avec succès"}), 200


@controllers_associations.put('/content/<int:association_id>/<int:media_id>')
@login_required
@est_membre_de_asso(actuel=True)
def rename_content_asso(association_id: int, media_id: int):
    """
    Renomme un contenu (photo) pour une association.
    """
    media = ElementMedia.query.get(media_id)
    if media is None:
        return jsonify({"message": "Media non trouvé"}), 404

    if media.association_id != association_id:
        return jsonify({"message": "Action non autorisée"}), 403

    data = request.get_json() or {}
    new_name = data.get('name')
    if not new_name:
        return jsonify({"message": "Nom manquant"}), 400

    try:
        media.nom = new_name
        db.session.commit()
        return jsonify({"message": "Media renommé avec succès", "nom": media.nom}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erreur lors du renommage : {str(e)}"}), 500




@controllers_associations.route('/<int:association_id>/add_content/<int:mandat_id>', methods=['POST'])
@login_required
@est_membre_de_asso
def route_add_content(association_id, mandat_id):
    """
    Ajoute du contenu au dossier de l'association, associé à un mandat
    """
    asso = get_association(association_id)
    if not asso:
        return jsonify({"success": False, "message": "Association introuvable"}), 404

    mandat = db.session.get(AssociationMandat, mandat_id)
    if not mandat or mandat.association_id != association_id:
        return jsonify({"success": False, "message": "Mandat introuvable"}), 404

    # Définition du dossier d'upload
    UPLOAD_FOLDER = os.path.join('associations', asso.nom_dossier)
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    # Vérifier si un fichier a été envoyé
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "Aucun fichier reçu"}), 400
    file = request.files['file']
    # Vérifier si l'extension du fichier est autorisée
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        return jsonify({"success": False, "message": "Extension de fichier non autorisée"}), 400

    media = upload_media(file, UPLOAD_FOLDER, mandat_id=mandat_id)
    if not media:
        return jsonify({"message": "Impossible de créer le fichier."}), 400
    return jsonify({"success": True, "message": "Fichier ajouté avec succès", "file_name": media.file_path}), 200


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

    return jsonify([{"id": asso.id, "ordre_importance": asso.ordre_importance, "nom": asso.nom} for asso in assos])


@controllers_associations.route('/<int:association_id>', methods=['GET'])
@login_required
def route_get_asso(association_id):
    if current_user.est_baptise or current_user.est_superutilisateur:
        asso = Association.query.filter_by(id=association_id).first()
    else:
        asso = Association.query.filter_by(a_cacher_aux_nouveaux=False, id=association_id).first()

    if not asso:
        return jsonify({"error": "Association not found"}), 404

    return jsonify(asso.to_dict())


@controllers_associations.route('/mandat/<int:mandat_id>', methods=['GET'])
@login_required
def route_get_mandat(mandat_id):
    mandat = AssociationMandat.query.get(mandat_id)
    if mandat is None\
       or (mandat.association.a_cacher_aux_nouveaux and not (current_user.est_baptise or current_user.est_superutilisateur)):
        return jsonify({"error": "Mandat not found"}), 404

    return jsonify(mandat.to_dict())


@controllers_associations.route("route_est_membre_de_asso/<int:id_association>", methods=["GET"])
@login_required
def route_est_membre_de_asso(id_association: int):
    is_membre = any(role.mandat.association_id == id_association for role in current_user.associations)
    autorise = is_membre or current_user.est_superutilisateur
    cotisant = any(cotiz.cotisation.association_id == id_association for cotiz in current_user.cotisations if cotiz.est_active())
    admin = is_admin_asso(current_user, id_association)
    return jsonify({"is_membre": is_membre, "autorise": autorise, "cotisant": cotisant, "admin": admin}), 200
