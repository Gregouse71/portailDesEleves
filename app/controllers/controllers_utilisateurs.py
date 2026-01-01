from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime, date

from app.services import *
from app.utils.decorators import *
from app.services.services_utilisateurs import *
from app.models.models_associations import AssociationMembre


# Creer le blueprint pour les utilisateurs
controllers_utilisateurs = Blueprint('controllers_utilisateurs', __name__)


@controllers_utilisateurs.route('/obtenir_liste_utilisateurs/<int:promo>/<string:cycles>', methods=['GET'])
@login_required
def obtenir_liste_utilisateurs(promo: int, cycles: str):
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
        Utilisateur.promotion == str(promo),
        Utilisateur.cycle.in_(str_cycles)
    ).all()
    # Conversion en JSON
    liste_utilisateurs = [u.to_dict() for u in utilisateurs]
    return jsonify(liste_utilisateurs), 200


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
    utilisateur = get_utilisateur(user_id)
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
    utilisateur = get_utilisateur(user_id)
    if not utilisateur:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    roles = AssociationMembre.query.filter_by(utilisateur_id=user_id).join(AssociationMembre.mandat).join(AssociationMandat.association).all()

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
            "asso_id": role.mandat.association_id
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
    utilisateur = get_utilisateur(user_id)
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
    utilisateur = get_utilisateur(user_id)
    if not utilisateur:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Pas le droit"}), 401

    data = request.get_json()
    
    utilisateur.ville_origine = data.get("ville_origine")
    utilisateur.chambre = data.get("chambre")
    utilisateur.instruments = data.get("instruments")
    utilisateur.telephone = data.get("telephone")
    utilisateur.email = data.get("email")
    
    date_de_naissance = data.get("date_de_naissance") 
    if date_de_naissance:
        try:
            utilisateur.date_de_naissance = datetime.strptime(date_de_naissance, "%Y-%m-%d").date() 
        except ValueError:
            return jsonify({"message": "Format de date de naissance invalide. Utilisez 'YYYY-MM-DD'."}), 400

    db.session.add(utilisateur)
    db.session.commit()
    return jsonify({"message": "Reponses patchées"}), 200


@controllers_utilisateurs.route('/supprimer_co/<int:co_id>', methods=['DELETE'])
@login_required
def route_supprimer_co(co_id: int):
    """
    Supprime un co de l'utilisateur connecte et de son co
    """
    utilisateur = current_user
    co = get_utilisateur(co_id)
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
    co = get_utilisateur(new_co_id)
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

    user = get_utilisateur(user_id)
    if not user:
        return jsonify({"message": "Utilisateur non trouvé"}), 404

    if not (user_id == current_user.id or current_user.est_superutilisateur):
        return jsonify({"message": "Action non autorisée"}), 403

    if co_ids:
        cos = [get_utilisateur(co_id) for co_id in co_ids]
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

    marrain = get_utilisateur(user_id)
    if not marrain:
        return jsonify({"message": "Utilisateur (marrain) non trouvé"}), 404

    if not isinstance(fillots_id_list, list) or not all(isinstance(i, int) for i in fillots_id_list):
        return jsonify({"message": "La liste d'IDs de fillots est invalide"}), 400

    fillots_list = [get_utilisateur(id_fillot) for id_fillot in fillots_id_list]

    if None in fillots_list:
        return jsonify({"message": "Un ou plusieurs IDs de fillots sont invalides"}), 404

    try:
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
            fillot.marrain = None
            db.session.commit()
        return jsonify({"message": "Marrain mis à jour avec succès"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Erreur lors du changement de marrain : {str(e)}"}), 500

@controllers_utilisateurs.route('/search/<string:query>', methods=['GET'])
@login_required
def search_users(query):
    """
    Search for users by username, first name, last name or phone number.
    """
    try:
        search_term = f"%{query}%"
        users = Utilisateur.query.filter(
            (Utilisateur.nom_utilisateur.ilike(search_term)) |
            (Utilisateur.prenom.ilike(search_term)) |
            (Utilisateur.nom.ilike(search_term)) |
            (Utilisateur.telephone.ilike(search_term))
        ).all()

        user_list = [
            {
                "id": user.id,
                "nom_utilisateur": user.nom_utilisateur,
                "prenom": user.prenom,
                "nom": user.nom,
                "promotion": user.promotion,
                "photo": user.photo
            }
            for user in users
        ]

        return jsonify(user_list)
    except Exception as e:
        return jsonify({"message": f"Erreur lors de la recherche : {str(e)}"}), 500