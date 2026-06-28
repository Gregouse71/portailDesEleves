from flask import Blueprint, request, jsonify, current_app, abort
from flask_login import login_required, current_user
from sqlalchemy import desc, asc, case
import os
from werkzeug.utils import secure_filename
import csv
import io

from app import db
from app.utils.verification_format import valider_questions_du_portail, valider_chaine_texte
from app.utils.decorators import superutilisateur_required
from app.utils.divers_utils import get_embed_url
from app.services.services_utilisateurs import supprimer_co, ajouter_co, changer_co, prochains_anniv, supprimer_fillots, changer_marrain, add_utilisateur, set_user_photo, set_user_banniere, get_user_media
from app.services.services_media import upload_media, delete_media
from app.models.models_utilisateurs import Utilisateur
from app.models.models_associations import AssociationMembre, AssociationMandat
from app.models.models_media import ElementMedia


# Creer le blueprint pour les utilisateurs
controllers_utilisateurs = Blueprint('controllers_utilisateurs', __name__)


@controllers_utilisateurs.route('/obtenir_liste_utilisateurs/<string:promo>/<string:cycles>', methods=['GET'])
@login_required
def obtenir_liste_utilisateurs(promo: str, cycles: str):
    """
    Renvoie la liste des utilisateurs par cycle et par promotion
    - cycles est une liste en string de la forme "ic,ast"
    - Ne fonctionne pas pour renvoyer la de
    """
    str_cycles = cycles.split(",")
    valid_cycles = {'ic', 'ast', 'vs', 'ev', 'isup'}
    # Vérification des cycles
    for cycle in str_cycles:
        if cycle not in valid_cycles:
            return jsonify({"message": f"Erreur : cycle invalide '{cycle}'. Valeurs autorisées: {valid_cycles}"}), 400
    # Récupération des utilisateurs avec seulement les champs nécessaires
    utilisateurs = Utilisateur.query.filter(
        Utilisateur.promotion == promo,
        Utilisateur.cycle.in_(str_cycles)
    ).order_by(Utilisateur.nom).all()
    # Conversion en JSON
    cycle = {"ic": 1, "isup": 2, "ast": 3, "vs": 4}
    liste_utilisateurs = [u.to_dict() for u in utilisateurs]
    return jsonify(sorted(liste_utilisateurs, key=lambda x: cycle[x["cycle"]] if x["cycle"] in cycle else 10)), 200



@controllers_utilisateurs.route('/obtenir_liste_des_promos', methods=["GET"])
@login_required
def obtenir_liste_des_promos():
    """Renvoie la liste des promotions au format JSON"""
    promotions = db.session.query(Utilisateur.promotion).distinct().all()
    promotions_list = [promo[0] for promo in promotions if promo[0] is not None and promo[0] != "00"]  # Exclure les None
    return jsonify(promotions_list)


@controllers_utilisateurs.route('/charger_utilisateurs', defaults={'promo': None})
@controllers_utilisateurs.route('/charger_utilisateurs/<int:promo>', methods=['GET'])
@login_required
def charger_utilisateurs(promo: int):
    """
    Charge la liste des utilisateurs d'une promo donnée ou de tous les utilisateurs si aucune promo n'est spécifiée.
    """
    if promo:
        utilisateurs = Utilisateur.query.filter_by(promotion=promo).all()
    else:
        utilisateurs = Utilisateur.query.all()

    liste_utilisateurs = [
        {
            "id": utilisateur.id,
            "nom_utilisateur": utilisateur.nom_utilisateur,
            "prenom": utilisateur.prenom,
            "nom": utilisateur.nom,
            "promotion": utilisateur.promotion,
            "solde_octo": utilisateur.solde_octo,
            "solde_biero": utilisateur.solde_biero,
            "est_cotisant_biero": utilisateur.est_cotisant_biero,
            "est_cotisant_octo": utilisateur.est_cotisant_octo
        }
        for utilisateur in utilisateurs
    ]

    return jsonify(liste_utilisateurs), 200


# routes API :
# /!\ NON securisé. Doit être utilisé pour de l'affichage uniquement,
# chaque route sensible doit avoir le decorateur @superutilisateur_required
@controllers_utilisateurs.route("/verifier_superutilisateur", methods=["GET"])
@login_required
def verifier_superutilisateur():
    """
    Vérifie si l'utilisateur connecté est un superutilisateur.
    Retourne { "is_superuser": True } si oui, sinon { "is_superuser": False }.
    """
    return jsonify({"is_superuser": current_user.est_superutilisateur})


@controllers_utilisateurs.route("/obtenir_id_par_nomutilisateur/<string:nom_utilisateur>", methods=["GET"])
@login_required
def obtenir_id_par_nomutilisateur(nom_utilisateur: str):
    """
    Récupère l'ID d'un utilisateur à partir de son nom d'utilisateur.
    """
    utilisateur = Utilisateur.query.filter_by(nom_utilisateur=nom_utilisateur).first()
    if utilisateur:
        return jsonify({"success": True, "id_utilisateur": utilisateur.id}), 200
    else:
        return jsonify({"success": False, "message": "Utilisateur introuvable"}), 404


@controllers_utilisateurs.route('/obtenir_infos_profil/<int:user_id>', methods=['GET'])
@login_required
def obtenir_infos_profil(user_id: int):
    """
    Fournit les informations affichees sur le profil d'un utilisateur
    """
    utilisateur = Utilisateur.query.get(user_id)
    if not utilisateur:
        return jsonify({"message": "Utilisateur non trouvé"}), 404
    else:
        return jsonify(utilisateur.to_dict()), 200


@controllers_utilisateurs.route('/assos_utilisateur/<int:user_id>', methods=['GET', 'POST'])
@login_required
def assos_utilisateur(user_id: int):
    """
    Renvoie les assos de l'utilisateur, avec leurs noms et le rôle dans l'asso
    """
    utilisateur = Utilisateur.query.get(user_id)
    if not utilisateur:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    roles = AssociationMembre.query.filter_by(utilisateur_id=user_id)\
    .join(AssociationMembre.mandat)\
    .join(AssociationMandat.association)\
    .order_by(case((AssociationMembre.ordre == None, 1), else_=0), asc(AssociationMembre.ordre))\
    .all()
    
    current_user_is_baptise = current_user.est_baptise or current_user.est_superutilisateur

    actuel_assos = []
    ancien_assos = []

    for role in roles:
        # Check if the association should be hidden from non-baptized users
        if role.mandat.association.a_cacher_aux_nouveaux and not current_user_is_baptise:
            continue  # Skip this association

        asso_data = {
            "role": role.role,
            "mandat": role.mandat.nom,
            "asso_id": role.mandat.association_id,
            "mandat_id": role.mandat_id
        }
        if role.mandat.actuel:
            actuel_assos.append(asso_data)
        else:
            ancien_assos.append(asso_data)

    data = {
        "actuel": actuel_assos,
        "ancien": ancien_assos
    }
    return jsonify(data)


@controllers_utilisateurs.route('/questions_reponses/<int:user_id>', methods=['GET', 'POST'])
@login_required
def questions_reponses(user_id: int):
    """
    Renvoie ou modifie les réponses au questions du portail
    """
    utilisateur = Utilisateur.query.get(user_id)
    if not utilisateur:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    if request.method == 'GET':
        return jsonify(utilisateur.questions_reponses_du_portail), 200

    elif request.method == 'POST':
        if not (user_id == current_user.id or current_user.est_superutilisateur):
            return jsonify({"message": "Pas le droit"}), 401

        data = request.get_json()
        if not valider_questions_du_portail(data):
            return jsonify({"message": "Reponses mal formées"}), 400
        utilisateur.questions_reponses_du_portail = data
        db.session.add(utilisateur)
        db.session.commit()
        return jsonify({"message": "Reponses patchées"}), 200


@controllers_utilisateurs.route('/infos/<int:user_id>', methods=['POST'])
@login_required
def set_user_infos(user_id: int):
    """
    Renvoie ou modifie les réponses au questions du portail
    """
    utilisateur = Utilisateur.query.get(user_id)
    if not utilisateur:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Pas le droit"}), 401

    data = request.get_json()
    utilisateur.update(data)
    db.session.add(utilisateur)
    db.session.commit()
    return jsonify(utilisateur.to_dict()), 200


@controllers_utilisateurs.post('/content/<int:user_id>')
@login_required
def add_content_to_user(user_id: int):
    """
    Ajoute un contenu (photo ou lien vidéo/iframe) pour un utilisateur.
    """
    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403

    if request.is_json:
        data = request.get_json() or {}
        input_url = data.get('url')
        if not input_url:
            return jsonify({"message": "Aucune URL fournie"}), 400
        
        embed_url = get_embed_url(input_url)
        if not embed_url:
            return jsonify({"message": "Lien URL invalide"}), 400

        media = ElementMedia(utilisateur_id=user_id, association_id=None, file_path=embed_url)
        db.session.add(media)
        db.session.commit()
        return jsonify({"message": "Lien vidéo ajouté avec succès", "file_name": media.file_path}), 200

    if 'file' not in request.files:
        return jsonify({"message": "Aucun fichier n'a été envoyé"}), 400

    file = request.files['file']
    media = upload_media(file, 'utilisateurs', user_id=user_id)
    if not media:
        return jsonify({"message": "Impossible de créer le fichier."}), 400
    return jsonify({"message": "Fichier téléversé avec succès", "file_name": media.file_path}), 200

@controllers_utilisateurs.get('/content/<int:user_id>')
@login_required
def get_content_user(user_id: int):
    files = get_user_media(user_id)
    return jsonify(files), 200

@controllers_utilisateurs.delete('/content/<int:media_id>')
@login_required
def delete_content_user(media_id):
    """
    Supprime un contenu (photo) pour un utilisateur.
    """
    media = ElementMedia.query.get(media_id)
    if media is None:
        return jsonify({"message": "Media non trouvé"}), 404

    if not (media.utilisateur_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403

    if len(Utilisateur.query.filter_by(photo_id=media.id).all()) > 0:
        return jsonify({"message": "Impossible de supprimer une photo de profil"}), 400

    if not delete_media(media):
        return jsonify({"message": "Media protégé"}), 400
    for u in Utilisateur.query.filter_by(banniere_id=media.id).all():
        u.banniere_id = None
    db.session.commit()

    return jsonify({"message": "Media supprimé avec succès"}), 200


@controllers_utilisateurs.route('/<int:user_id>/modifier_photo/<int:new_id>', methods=['POST'])
@login_required
def modifier_photo_utilisateur(user_id: int, new_id: int):
    """
    Modifie la photo de profil d'un utilisateur.
    """
    utilisateur = Utilisateur.query.get(user_id)
    if not utilisateur:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403
    
    set_user_photo(user_id, new_id)

    return jsonify({"message": "Photo de profil mise à jour avec succès"}), 200


@controllers_utilisateurs.post('/<int:user_id>/modifier_banniere')
@login_required
def modifier_banniere_utilisateur(user_id: int):
    """
    Modifie la bannière d'un utilisateur.
    """
    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403
    
    data = request.get_json()
    new_name = data.get('banniere')

    set_user_banniere(user_id, new_name)

    return jsonify({"message": "Bannière mise à jour avec succès"}), 200


@controllers_utilisateurs.route('/supprimer_co/<int:co_id>', methods=['DELETE'])
@login_required
def route_supprimer_co(co_id: int):
    """
    Supprime un co de l'utilisateur connecte et de son co
    """
    utilisateur = current_user
    co = Utilisateur.query.get(co_id)
    if not co:
        return jsonify({"message": "Co non trouvé"}), 404
    try:
        supprimer_co(utilisateur, co)
        return jsonify({"message": "Lien de co supprime avec succes"}), 200
    except Exception as e:
        return jsonify({"message": f"Erreur lors de la suppression du lien de co : {str(e)}"}), 500


@controllers_utilisateurs.route('/ajouter_co/<int:new_co_id>', methods=["POST"])
@login_required
def route_ajouter_co(new_co_id: int):
    """
    Cree un lien de colocation entre deux utilisateurs en modifiant leurs attributs.
    """
    co = Utilisateur.query.get(new_co_id)
    if not co:
        return jsonify({"message": "Utilisateur Co non trouve"}), 404
    try:
        ajouter_co(current_user, co)
        return jsonify({"message": "Lien de co cree avec succes"}), 200
    except Exception as e:
        return jsonify({"message": f"Erreur lors de la creation du lien de co : {str(e)}"}), 500

@controllers_utilisateurs.route('/changer_co', methods=['POST'])
@login_required
def route_changer_co():
    """
    Change le co d'un utilisateur.
    Prend un JSON avec "user_id" and "co_ids".
    """
    data = request.get_json()
    user_id = int(data.get('user_id'))
    co_ids = data.get('co_ids')

    user = Utilisateur.query.get(user_id)
    if not user:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403

    if co_ids:
        cos = [Utilisateur.query.get(co_id) for co_id in co_ids]
        if None in cos:
            return jsonify({"message": "Un ou plusieurs cos n'ont pas été trouvés"}), 404
        changer_co(user, cos)
    else:
        changer_co(user, [])
    
    return jsonify({"message": "Co mis à jour avec succès"}), 200

# Ajouter un decorateur qui verifie si on a le droit de modifier sa genealogie (variable globale mise a True pendant le parrainnage)


@controllers_utilisateurs.route('/select_fillots', methods=["POST"])
@login_required
def route_selectionner_fillots():
    """
    Définit la liste de fillots pour un utilisateur donné.
    Prend un JSON avec "user_id" et "fillots_ids".
    """
    data = request.get_json()
    user_id = int(data.get('user_id'))
    fillots_id_list = data.get('fillots_ids')

    if not user_id or fillots_id_list is None:
        return jsonify({"message": "user_id et fillots_ids requis"}), 400

    # Authorization check
    if not (current_user.id == user_id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403

    marrain = Utilisateur.query.get(user_id)
    if not marrain:
        return jsonify({"message": "Utilisateur (marrain) non trouvé"}), 404

    if not isinstance(fillots_id_list, list) or not all(isinstance(i, int) for i in fillots_id_list):
        return jsonify({"message": "La liste d'IDs de fillots est invalide"}), 400

    fillots_list = [Utilisateur.query.get(id_fillot) for id_fillot in fillots_id_list]

    if None in fillots_list:
        return jsonify({"message": "Un ou plusieurs IDs de fillots sont invalides"}), 404

    try:
        for f in fillots_list:
            f.marrain = [marrain]
        marrain.fillots = fillots_list
        db.session.commit()
        return jsonify({"message": "Fillots mis à jour avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erreur lors de la mise à jour des fillots : {str(e)}"}), 500
# Ajouter un decorateur qui verifie si on a le droit de modifier sa genealogie (variable globale mise a True pendant le parrainnage)


@controllers_utilisateurs.route('/supprimer_fillots', methods=['DELETE'])
@login_required
def route_supprimer_fillots():
    """
    Supprime ses fillots. Ne renvoie pas d'erreur si l'utilisateur n'a pas de fillot. 
    Supprime donc en consequence le marrain des fillots concernes
    Verifie avant de modifier le fillot que le lien etait bien comme il devait etre
    Cette fonction ne doit etre utilisee qu'en cas d'erreur lors de l'attribution des fillots
    """
    try:
        supprimer_fillots(current_user)
        return jsonify({"message": "Fillot(s) supprime(s) avec succes"}), 200
    except Exception as e:
        return jsonify({"message": f"Erreur lors de la suppression des fillots : {str(e)}"}), 500


# Ajouter un decorateur qui verifie si on a le droit de modifier sa genealogie (variable globale mise a True pendant le parrainnage)
@controllers_utilisateurs.route('/prochains_anniv', methods=['GET'])
@login_required
def route_get_anniv():
    """
    Renvoie la liste des prochains anniversaires
    """
    try:
        ret = prochains_anniv()
        return jsonify(ret), 200
    except Exception as e:
        return jsonify({"message": f"Erreur lors de l'obtention de la liste d'anniversaires' : {str(e)}"}), 500
    

@controllers_utilisateurs.route('/changer_marrain', methods=["POST"])
@login_required
def route_changer_marrain():
    """
    Change ou supprime le marrain d'un fillot.
    Prend un JSON avec "fillot_id" et optionnellement "marrain_id".
    Si "marrain_id" est null ou absent, le marrain est supprimé.
    """
    data = request.get_json()
    fillot_id = int(data.get('fillot_id'))
    marrain_id = data.get('marrain_id') # Can be null

    if not fillot_id:
        return jsonify({"message": "fillot_id requis"}), 400

    fillot = Utilisateur.query.get(fillot_id)
    if not fillot:
        return jsonify({"message": "Fillot non trouvé"}), 404

    # Authorization check: only superuser or the fillot themselves can change marrain
    if not (current_user.id == fillot_id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403

    try:
        if marrain_id:
            marrain = Utilisateur.query.get(marrain_id)
            if not marrain:
                return jsonify({"message": "Marrain non trouvé"}), 404
            changer_marrain(marrain, fillot)
        else:
            # Remove marrain
            fillot.marrains = []
            db.session.commit()
        return jsonify({"message": "Marrain mis à jour avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erreur lors du changement de marrain : {str(e)}"}), 500

@controllers_utilisateurs.route('/add_utilisateur', methods=['POST'])
@superutilisateur_required
def route_add_utilisateur():
    return jsonify({"message": "Not implemented"}), 501
    data = request.form
    photo = request.files['photo']
    # TODO : upload photo en même temps, ou faire interface pour upload bcp de photos
    try:
        nom_utilisateur = data['nom_utilisateur']
        email = data['email']
        nom = data['nom']
        prenom = data['prenom']
        promotion = data['promotion']
        cycle = data['cycle'].lower()
    except KeyError as e:
        return jsonify({"message": f"Au moins un champ est manquant pour l'ajout d'un utilisateur: {str(e)}"}), 400
    try:
        user_id = add_utilisateur(nom_utilisateur=nom_utilisateur,
                        email=email,
                        prenom=prenom,
                        nom=nom,
                        promotion=promotion,
                        cycle=cycle)
        req = upload_media(photo, user_id).file_path
        filename = req[0].json['file_name']
        set_user_photo(user_id, filename)
        return jsonify({"message": "Utilisateur ajouté avec succès"}), 203
    except ValueError as e:
        return jsonify({"message": f"Au moins un champ est invalide pour l'ajout d'un utilisateur: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erreur lors de l'ajout d'un utilisateur : {str(e)}"}), 500

@controllers_utilisateurs.post('/search')
@login_required
def search_users():
    """
    Search for users by username, first name, last name or phone number.
    """
    data = request.json
    query = data.get("query")
    limit = data.get("limit")
    offset = data.get("offset")
    try:
        search_term = f"%{query}%"
        query = Utilisateur.query.order_by(desc(Utilisateur.promotion)).filter(
            (Utilisateur.nom_utilisateur.ilike(search_term)) |
            (Utilisateur.prenom.ilike(search_term)) |
            (Utilisateur.nom.ilike(search_term)) |
            (Utilisateur.telephone.ilike(search_term))
        )
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)
        users = query.all()

        user_list = [user.to_dict() for user in users]

        return jsonify(user_list)
    except Exception as e:
        return jsonify({"message": f"Erreur lors de la recherche : {str(e)}"}), 500


@controllers_utilisateurs.post("/process_list")
@login_required
@superutilisateur_required
def process_list_utilisateurs():
    file = request.files.get("file")

    if not file:
        abort(400)
    
    stream = io.StringIO(file.read().decode("UTF8"), newline=None)
    reader = csv.DictReader(stream)
    
    users = []
    for row in reader:
        print(row)
        uid = row["Promo"] + row["Nom"].lower()
        user = Utilisateur(uid, row["Prenom"], row["Nom"], row["Promo"], row["Email"], row["Cycle"], "1111")
        users.append(user)
        
    return jsonify([u.to_dict() for u in users]), 200


@controllers_utilisateurs.post("/create_bulk")
@login_required
@superutilisateur_required
def add_many_users():
    lst = request.json.get("list")
    if not lst:
        abort(400)

    for row in lst:
        user = Utilisateur(row["nom_utilisateur"], row["prenom"], row["nom"], row["promotion"], row["email"], row["cycle"], "1111")
        user.photo = row["nom_utilisateur"] + ".jpg"
        user.mot_de_passe = "1111"  # Empecher toute connexion avant reinitialisation du mot de passe
        db.session.add(user)
    db.session.commit()
    return jsonify(True), 200


@controllers_utilisateurs.route('/<int:user_id>/ordre_assos', methods=['POST'])
@login_required
def modifier_ordre_assos(user_id: int):
    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403
    data = request.get_json()
    try:
        for item in data:
            membre = AssociationMembre.query.filter_by(
                utilisateur_id=user_id,
                mandat_id=item['id']
            ).first()
            if membre:
                membre.ordre = item['ordre']
        db.session.commit()
        return jsonify({"message": "Ordre mis à jour avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erreur : {str(e)}"}), 500