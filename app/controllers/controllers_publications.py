from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
import os
from werkzeug.utils import secure_filename
from datetime import datetime

from app import db
from app.services import *
from app.utils.decorators import *
from app.services.services_publications import *

controllers_publications = Blueprint('controllers_publications', __name__)


@controllers_publications.route("/tag/<tag>", methods=['GET'])
@login_required
def route_get_publications_by_tag(tag: str):
    """
    Renvoie toutes les publications avec un tag spécifique.
    """
    try:
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', type=int)

        publications = get_publications_by_tag(tag, limit=limit, offset=offset)
        return jsonify({"publications": [{"id": e.id,
                                          "auteur": e.auteur.nom_utilisateur if e.auteur else None,
                                          "titre": e.titre,
                                          "contenu": e.contenu,
                                          "date_publication": e.date_publication,
                                          "likes": e.likes,
                                          "is_commentable": e.is_commentable,
                                          "commentaires": [comment.to_dict() for comment in e.commentaires],
                                          "fichier_joint": e.fichier_joint,
                                          "miniature": e.miniature,
                                          "tags": e.tags,
                                          "association": {"id": e.association.id, "nom": e.association.nom, "nom_dossier": e.association.nom_dossier} if e.association else None}
                                         for e in publications]}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400


@controllers_publications.route("obtenir_publications_asso/<int:association_id>", methods=['GET'])
@login_required
def route_obtenir_publications_asso(association_id: int):
    """
    Renvoie la liste des id des posts d'une asso
    """
    try:
        limit = request.args.get('limit', type=int)
        offset = request.args.get('offset', type=int)

        query = Publication.query.filter(Publication.id_association == association_id)
        if not (current_user.est_superutilisateur):
            # publications internes
            if not any(role.mandat.association_id == association_id for role in current_user.associations):
                query = query.filter(Publication.is_publication_interne.is_(False))
            # publications sensibles
            if not current_user.est_baptise and not current_user.est_superutilisateur:
                query = query.filter(Publication.a_cacher_aux_nouveaux.is_(False))
            # publications spécifiques aux differents cycles
            query = query.filter(~Publication.a_cacher_to_cycles.contains(current_user.cycle))
        
        query = query.order_by(desc(Publication.date_publication))

        if limit is not None:
            query = query.limit(limit)
        
        if offset is not None:
            query = query.offset(offset)

        publications = query.all()
        return jsonify([p.id for p in publications]), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    

@controllers_publications.route("obtenir_publication/<int:post_id>")
@login_required
def route_obtenir_publication(post_id: int):
    """
    Renvoie toutes les publications d'une asso
    Avec les commentaires
    """
    # try:
    publication_for_id = Publication.query.get(post_id)
    if not publication_for_id:
        return jsonify({"error": "Publication non trouvée"}), 404
    
    association_id = publication_for_id.id_association

    query = Publication.query.filter(Publication.id == post_id)
    if not (current_user.est_superutilisateur):
        # publications internes
        if not any(role.mandat.association_id == association_id for role in current_user.associations):
            query = query.filter(Publication.is_publication_interne.is_(False))
        # publications sensibles
        if not current_user.est_baptise and not current_user.est_superutilisateur:
            query = query.filter(Publication.a_cacher_aux_nouveaux.is_(False))
        # publications spécifiques aux differents cycles
        query = query.filter(~Publication.a_cacher_to_cycles.contains(current_user.cycle))
    publication = query.order_by(desc(Publication.date_publication)).all()
    return jsonify(publication[0].to_dict()), 200
    # except ValueError as e:
    #     return jsonify({"error": str(e)}), 400


@controllers_publications.route('/recent', methods=['GET'])
@login_required
def route_add_get_publications_recentes():
    """
    Renvoie les dernieres publications
    """
    try:
        limit = request.args.get('limit', 10, type=int)
        publications = Publication.query.order_by(desc(Publication.date_publication)).limit(limit).all()
        return jsonify([p.id for p in publications]), 200
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 500



@controllers_publications.route("<int:association_id>/creer_nouvelle_publication", methods=['POST'])
@login_required
@est_membre_de_asso
def route_creer_publication(association_id: int):
    """
    Ajoute une nouvelle publication dans la BDD. 
    """
    try:
        asso = Association.query.get(association_id)
        if asso:
            data = request.json
            id_publication = add_publication(
                association=asso,
                titre=data["titre"],
                contenu=data["contenu"],
                is_commentable=data["is_commentable"],
                a_cacher_to_cycles=data["a_cacher_to_cycles"],
                a_cacher_aux_nouveaux=data["a_cacher_aux_nouveaux"],
                is_publication_interne=data["is_publication_interne"],
                fichier_joint=data.get("fichier_joint"),
                miniature=data.get("miniature"),
                tags=data.get("tags")
            )
            return jsonify({"message": "événement créé avec succès", "id_publication": id_publication}), 201
        else:
            return jsonify({"message": "association non trouvée"}), 404
    except Exception as e:
        return jsonify({"message": f"erreur lors de la création de l'événement : {e}"}), 500


@controllers_publications.route("<int:association_id>/supprimer_publication/<int:publication_id>", methods=["DELETE"])
@login_required
@est_membre_de_asso
def route_supprimer_publication(association_id, publication_id):
    """
    Supprime la publication
    Ainsi que toutes les commentaires associés
    """
    publication = Publication.query.get(publication_id)
    if not publication:
        return jsonify({"message": "publication non trouvé"}), 404
    if publication.a_cacher_aux_nouveaux and (not current_user.est_baptise):
        # Les non baptisés n'ont pas le droit de supprimer les posts cachés
        return jsonify({"message": "publication non trouvé"}), 404
    remove_publication(publication)
    return jsonify({"message": "publication supprimée avec succès"}), 200


@controllers_publications.route("/supprimer_commentaire/<int:comment_id>", methods=["DELETE"])
@login_required
def route_supprimer_commentaire(comment_id):
    """
    Supprime la publication
    Ainsi que toutes les commentaires associés
    """
    commentaire = Commentaire.query.get(comment_id)
    if not commentaire:
        return jsonify({"message": "commentaire non trouvé"}), 404
    publication = commentaire.publication
    if publication.a_cacher_aux_nouveaux and (not current_user.est_baptise):
        # Les non baptisés n'ont pas le droit de supprimer les posts cachés
        return jsonify({"message": "commentaire non trouvé"}), 404
    if current_user.est_superutilisateur or (publication.id_association in current_user.associations_actuelles.keys()) or commentaire.id_ateur == current_user.id:
        remove_comment(commentaire)
        return jsonify({"message": "publication supprimée avec succès"}), 200
    else:
        return jsonify({"message": "vous devez être auteur ou membre de l'association pour supprimer ce commentaire"}), 403


@controllers_publications.route("<int:association_id>/modifier_publication/<int:publication_id>", methods=["PUT"])
@login_required
@est_membre_de_asso
def route_modifier_publication(association_id, publication_id):
    """
    Modifie la publication
    Les commentaires associés sont inchangés
    """
    publication = Publication.query.get(publication_id)
    if publication:
        data = request.json
        if publication.a_cacher_aux_nouveaux and (not current_user.est_baptise) and not current_user.est_superutilisateur:
            # Les non baptisés n'ont pas le droit de modifier les posts cachés
            return jsonify({"message": "publication non trouvé"}), 404
        modify_publication(
            publication,
            data["titre"],
            data["contenu"],
            data["is_commentable"],
            data["a_cacher_to_cycles"],
            data["a_cacher_aux_nouveaux"],
            data["is_publication_interne"],
            data.get("fichier_joint"),
            data.get("miniature"),
            data.get("tags")
        )
        return jsonify({"message": "publication modifiée avec succès"}), 200
    else:
        return jsonify({"message": "publication non trouvée"}), 404


@controllers_publications.route("modifier_like_post/<int:post_id>", methods=['PATCH'])
@login_required
def route_modifier_likes_post(post_id: int):
    """
    Rajoute ou retire un like sur la publication.
    """
    try:
        post = Publication.query.get(post_id)
        if post:
            if post.a_cacher_aux_nouveaux and (not current_user.est_baptise):
                # Les non baptisés n'ont pas le droit de liker les posts cachés
                return jsonify({"message": "publication non trouvé"}), 404
            modify_like_post(post, current_user)
            return jsonify({"message": "like modifié avec succès"}), 201
        else:
            return jsonify({"message": "publication non trouvée"}), 404
    except Exception as e:
        return jsonify({"message": f"erreur lors de la modification de like: {e}"}), 500


@controllers_publications.route("modifier_like_comment/<int:comment_id>", methods=['PATCH'])
@login_required
def route_modifier_likes_comment(comment_id: int):
    """
    Rajoute ou retire un like sur le commentaire.
    """
    try:
        comment = Commentaire.query.get(comment_id)
        if comment:
            if comment.publication.a_cacher_aux_nouveaux and (not current_user.est_baptise):
                # Les non baptisés n'ont pas le droit de liker les posts de commentaires cachés
                return jsonify({"message": "commentaire non trouvé"}), 404
            modify_like_comment(comment, current_user)
            return jsonify({"message": "like modifié avec succès"}), 201
        else:
            return jsonify({"message": "commentaire non trouvée"}), 404
    except Exception as e:
        return jsonify({"message": f"erreur lors de la modification de like: {e}"}), 500


@controllers_publications.route("/<int:post_id>/creer_nouveau_commentaire", methods=['POST'])
@login_required
def route_creer_commentaire(post_id: int):
    """
    Ajoute un nouveau commentaire à la publication.
    """
    try:
        post = Publication.query.get(post_id)
        if post:
            data = request.json
            if post.a_cacher_aux_nouveaux and (not current_user.est_baptise):
                # Les non baptisés n'ont pas le droit de commenter les posts cachés
                return jsonify({"message": "publication non trouvé"}), 404
            comment_id = add_comment(post, current_user, data["contenu"])
            return jsonify({"message": "commentaire créé avec succès", "comment_id": comment_id}), 201
        else:
            return jsonify({"message": "publication non trouvée"}), 404
    except Exception as e:
        return jsonify({"message": f"erreur lors de la création du commentaire: {e}"}), 500
    
@controllers_publications.route("modifier_commentaire/<int:comment_id>", methods=["PUT"])
@login_required
def route_modifier_commentaire(comment_id):
    """
    Modifie le commentaire
    """
    commentaire = Commentaire.query.get(comment_id)
    if commentaire:
        data = request.json
        if commentaire.id_auteur == current_user.id :
            modify_comment(commentaire, data["contenu"])
            return jsonify({"message": "commentaire modifié avec succès"}), 200
        else :
            return jsonify({"message": "seul l'auteur peut modifier ce commentaire"}), 403
    else:
        return jsonify({"message": "commentaire non trouvé"}), 404


@controllers_publications.route('/<int:association_id>/<int:publication_id>/add_content', methods=['POST'])
@login_required
@est_membre_de_asso
def route_add_content_to_publication(association_id, publication_id):
    """
    Ajoute du contenu au dossier de la publication
    """
    try:
        fichier_joint_file = request.files.get('fichier_joint')
        miniature_file = request.files.get('miniature')

        fichier_joint_path, miniature_path = add_content_to_publication(
            publication_id=publication_id,
            fichier_joint_file=fichier_joint_file,
            miniature_file=miniature_file
        )

        return jsonify({"success": True, "message": "Fichiers ajoutés avec succès", "fichier_joint": fichier_joint_path, "miniature": miniature_path}), 200
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400

