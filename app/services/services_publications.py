from app.services import db
from app.models import Publication, Commentaire, Association, Utilisateur

from flask_login import current_user
from sqlalchemy.orm.attributes import flag_modified
import os
import shutil
import mimetypes
from werkzeug.utils import secure_filename
from datetime import datetime
from pdf2image import convert_from_path
from sqlalchemy import desc

# Gestion de publications


def _save_file(file, association_name, is_miniature=False):
    if not file:
        return None, None

    if is_miniature:
        UPLOAD_FOLDER = os.path.join("upload", "associations", association_name, "thumbnails")
        ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}
    else:
        UPLOAD_FOLDER = os.path.join("upload", "associations", association_name, "publications")
        ALLOWED_EXTENSIONS = {"txt", "pdf", "png", "jpg", "jpeg", "gif"}

    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    ext = ext.lower().lstrip(".")

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Extension de fichier non autorisée")

    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{name}_{timestamp}.{ext}"

    file_path_for_save = os.path.join(UPLOAD_FOLDER, filename)

    file.save(file_path_for_save)
    return filename, file_path_for_save


def _delete_file(filename, association_name, directory_name):
    UPLOAD_FOLDER = os.path.join("upload", "associations", association_name, directory_name)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    print(file_path)
    try:
        os.remove(file_path)
    except FileNotFoundError:
        pass


def _delete_publication_files(publication):
    print(publication.fichier_joint, publication.miniature)
    if publication.fichier_joint:
        _delete_file(publication.fichier_joint, publication.association.nom_dossier, "publications")
    if publication.miniature:
        _delete_file(publication.miniature, publication.association.nom_dossier, "thumbnails")


def _generate_pdf_thumbnail(pdf_path, output_dir, association_name):
    images = convert_from_path(pdf_path, first_page=1, last_page=1, fmt="png")
    if images:
        thumbnail_name = os.path.splitext(os.path.basename(pdf_path))[0] + "_thumb.png"
        thumbnail_path_for_save = os.path.join(output_dir, thumbnail_name)
        images[0].save(thumbnail_path_for_save, "PNG")
        return thumbnail_name
    return None


def add_publication(association: Association, titre: str, contenu: str, is_commentable: bool, a_cacher_to_cycles: list, a_cacher_aux_nouveaux: bool, is_publication_interne: bool, fichier_joint: str = None, miniature: str = None, tags: list = None):
    """
    Ajoute une publication à l'association
    """
    association = Association.query.get(association.id)
    if association:
        publication = Publication(
            association=association,
            auteur=current_user,
            titre=titre,
            contenu=contenu,
            date_publication=datetime.now(),
            is_commentable=is_commentable,
            a_cacher_to_cycles=a_cacher_to_cycles,
            a_cacher_aux_nouveaux=a_cacher_aux_nouveaux,
            is_publication_interne=is_publication_interne,
            fichier_joint=fichier_joint,
            miniature=miniature,
            tags=tags,
        )
        db.session.add(publication)
        db.session.commit()
        return publication.id
    else:
        raise ValueError("L'association n'existe pas")


def add_content_to_publication(publication_id: int, fichier_joint_file, miniature_file):
    publication = Publication.query.get(publication_id)
    if not publication:
        raise ValueError("Publication introuvable")

    _delete_publication_files(publication)
    if fichier_joint_file:
        fichier_joint_path_for_db, fichier_joint_path_for_save = _save_file(fichier_joint_file, publication.association.nom_dossier)
        publication.fichier_joint = fichier_joint_path_for_db

        # If no miniature is provided with it, generate one from the new file
        if not miniature_file:
            mime_type, _ = mimetypes.guess_type(fichier_joint_path_for_db)
            if mime_type == "application/pdf":
                output_dir = os.path.join("upload", "associations", publication.association.nom_dossier, "thumbnails")
                if not os.path.exists(output_dir):
                    os.makedirs(output_dir)
                publication.miniature = _generate_pdf_thumbnail(fichier_joint_path_for_save, output_dir, publication.association.nom_dossier)
            elif mime_type and mime_type.startswith("image"):
                thumbnail_dir = os.path.join("upload", "associations", publication.association.nom_dossier, "thumbnails")
                if not os.path.exists(thumbnail_dir):
                    os.makedirs(thumbnail_dir)

                shutil.copy(fichier_joint_path_for_save, os.path.join(thumbnail_dir, fichier_joint_path_for_db))
                publication.miniature = fichier_joint_path_for_db
            else:
                # New file is not an image/pdf, and no miniature provided.
                # Remove old miniature.
                publication.miniature = None

    if miniature_file:
        miniature_path, _ = _save_file(miniature_file, publication.association.nom_dossier, is_miniature=True)
        publication.miniature = miniature_path

    db.session.commit()

    return publication.fichier_joint, publication.miniature


def modify_publication(
    publication: Publication, titre: str, contenu: str, is_commentable: bool, a_cacher_to_cycles: list, a_cacher_aux_nouveaux: bool, is_publication_interne: bool, tags: list = None
):
    """
    Modifie une publication de l'association
    """
    publication = Publication.query.get(publication.id)
    if publication:
        publication.titre = titre
        publication.contenu = contenu
        publication.is_commentable = is_commentable
        publication.a_cacher_to_cycles = a_cacher_to_cycles
        publication.a_cacher_aux_nouveaux = a_cacher_aux_nouveaux
        publication.is_publication_interne = is_publication_interne

        publication.tags = tags

        db.session.commit()

    else:
        raise ValueError("La publication n'existe pas")


def modify_comment(commentaire: Commentaire, contenu: str):
    """
    Modifie le commentaire
    """
    commentaire = Commentaire.query.get(commentaire.id)
    if commentaire:
        commentaire.contenu = contenu
        db.session.commit()
    else:
        raise ValueError("Le commentaire n'existe pas")


def remove_publication(publication: Publication):
    """
    Retire une publication de l'association
    """
    publication = Publication.query.get(publication.id)
    if publication:
        _delete_publication_files(publication)
        db.session.delete(publication)
        db.session.commit()
    else:
        raise ValueError("La publication n'existe pas")


def add_like(publication: Publication, utilisateur: Utilisateur):
    """
    Ajoute un like à la publication
    """
    publication = Publication.query.get(publication.id)
    if publication:
        utilisateur = Utilisateur.query.get(utilisateur.id)
        if utilisateur:
            likes = publication.likes
            if utilisateur.id not in likes:
                likes.append(utilisateur.id)
            publication.likes = likes
        else:
            raise ValueError("L'utilisateur n'existe pas'")
    else:
        raise ValueError("La publication n'existe pas")


def remove_like(publication: Publication, utilisateur: Utilisateur):
    """
    Retire un like de la publication
    """
    publication = Publication.query.get(publication.id)
    if publication:
        utilisateur = Utilisateur.query.get(utilisateur.id)
        if utilisateur:
            likes = publication.likes
            likes.remove(utilisateur.id)
            publication.likes = likes
        else:
            raise ValueError("L'utilisateur n'existe pas'")
    else:
        raise ValueError("La publication n'existe pas")


def modify_like_post(publication: Publication, utilisateur: Utilisateur):
    """
    Rajoute un like sur la publication s'il n'est pas déjà présent
    Retire ce like sinon
    """
    publication = Publication.query.get(publication.id)
    if publication:
        utilisateur = Utilisateur.query.get(utilisateur.id)
        if utilisateur:
            likes = publication.likes
            if utilisateur.id in likes:
                likes.remove(utilisateur.id)
            else:
                likes.append(utilisateur.id)
            publication.likes = likes
            flag_modified(publication, "likes")
            db.session.commit()
        else:
            raise ValueError("L'utilisateur n'existe pas'")
    else:
        raise ValueError("La publication n'existe pas")


# Les commentaires


def modify_like_comment(commentaire: Commentaire, utilisateur: Utilisateur):
    """
    Rajoute un like sur le commentaire s'il n'est pas déjà présent
    Retire ce like sinon
    """
    commentaire = Commentaire.query.get(commentaire.id)
    if commentaire:
        utilisateur = Utilisateur.query.get(utilisateur.id)
        if utilisateur:
            likes = commentaire.likes
            if utilisateur.id in likes:
                likes.remove(utilisateur.id)
            else:
                likes.append(utilisateur.id)
            commentaire.likes = likes
            flag_modified(commentaire, "likes")
            db.session.commit()
        else:
            raise ValueError("L'utilisateur n'existe pas'")
    else:
        raise ValueError("Le commentaire n'existe pas")


def add_comment(publication: Publication, auteur: Utilisateur, contenu: str):
    """
    Ajoute un commentaire à la publication
    """
    publication = Publication.query.get(publication.id)
    if publication:
        auteur = Utilisateur.query.get(auteur.id)
        if auteur:
            if publication.is_commentable:
                new_comment = Commentaire(auteur=auteur, contenu=contenu, date=datetime.now(), publication=publication)
                db.session.add(new_comment)
                db.session.commit()
                return new_comment.id
            else:
                raise ValueError("La publication n'est pas commentable")
        else:
            raise ValueError("L'auteur n'existe pas")
    else:
        raise ValueError("La publication n'existe pas")


def remove_comment(commentaire: Commentaire):
    """
    Retire un commentaire de la publication
    """
    commentaire = Commentaire.query.get(commentaire.id)
    if commentaire:
        db.session.delete(commentaire)
        db.session.commit()
    else:
        raise ValueError("Le commentaire n'existe pas")


def add_like_to_comment(utilisateur: Utilisateur, commentaire: Commentaire):
    """
    Ajoute un like à un commentaire
    """
    commentaire = Commentaire.query.get(commentaire.id)
    if commentaire:
        utilisateur = Utilisateur.query.get(utilisateur.id)
        if utilisateur:
            likes = commentaire.likes
            if utilisateur.id not in likes:
                likes.append(utilisateur.id)
            commentaire.likes = likes
        else:
            raise ValueError("L'utilisateur n'existe pas")
    else:
        raise ValueError("Le commentaire n'existe pas")


def remove_like_from_comment(utilisateur: Utilisateur, commentaire: Commentaire):
    """
    Retire un like d'un commentaire
    """
    commentaire = Commentaire.query.get(commentaire.id)
    if commentaire:
        utilisateur = Utilisateur.query.get(utilisateur.id)
        if utilisateur:
            likes = commentaire.likes
            likes.remove(utilisateur.id)
            commentaire.likes = likes
        else:
            raise ValueError("L'utilisateur n'existe pas")
    else:
        raise ValueError("Le commentaire n'existe pas")


def get_publications_by_tag(tag: str, page: int = 1, per: int = 20, search_query: str = None):
    """
    Renvoie toutes les publications avec un tag spécifique,
    en tenant compte des permissions de l'utilisateur actuel.
    """
    query = Publication.query.filter(Publication.tags.contains(tag))

    if search_query:
        query = query.filter(Publication.titre.ilike(f"%{search_query}%"))

    if not current_user.est_superutilisateur:
        # Filter out internal publications if user is not a member of the associated association
        # This part needs to be carefully handled as Publication might not have an association
        # or the association might not be in current_user.associations
        # For now, I'll assume that if id_association is None, it's a global publication
        # and if it has an id_association, it needs to be checked.
        query = query.filter(
            (Publication.id_association == None) |
            (Publication.is_publication_interne.is_(False)) |
            (Publication.id_association.in_([role.mandat.association_id for role in current_user.associations]))
        )
        # Filter out sensitive publications if user is not 'baptise'
        if not (current_user.est_baptise or current_user.est_superutilisateur):
            query = query.filter(Publication.a_cacher_aux_nouveaux.is_(False))

        # Filter out cycle-specific publications
        query = query.filter(~Publication.a_cacher_to_cycles.contains(current_user.cycle))

    query = query.order_by(desc(Publication.date_publication)).paginate(page=page, per_page=per)

    return query.items, query.total, query.pages
