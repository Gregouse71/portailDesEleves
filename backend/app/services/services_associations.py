# importer les models grace a __init__.py de models
from flask_login import current_user

from app.services import db
from app.models.models_associations import Association, AssociationMandat, AssociationMembre
from app.models.models_utilisateurs import Utilisateur
from app.models.models_media import ElementMedia
import os
import shutil
from datetime import datetime
from config import Config


# GESTION DES ASSOCIATIONS
def create_association(
    nom: str, description: str, type_association: str,
    logo_path: str, ordre_importance: int,
    a_cacher_aux_nouveaux: bool
) -> Association:
    """
    Crée une nouvelle association
    """
    association = Association(nom, description, type_association, logo_path, ordre_importance, a_cacher_aux_nouveaux)
    db.session.add(association)
    db.session.commit()
    return association.id


def get_association(association_id) -> Association:
    """Renvoie un utilisateur depuis son id"""
    if association_id:
        return db.session.get(Association, association_id)
    else:
        return None
    

def get_mandat(mandat_id) -> AssociationMandat:  
    """Renvoie un utilisateur depuis son id"""
    if mandat_id:
        return AssociationMandat.query.filter_by(id=mandat_id).first()
    else:
        return None


def add_member(mandat: AssociationMandat, utilisateur: Utilisateur, role: str):
    """
    Ajoute un membre au mandat de l'association
    Renvoie une erreur si l'utilisateur ou l'association ou le mandat n'existe pas
    Renvoie également une erreur si l'utilisateur est déjà dans le mandat
    """
    if AssociationMembre.query.filter_by(utilisateur_id=utilisateur.id, mandat_id=mandat.id).first():
        raise ValueError("L'utilisateur est déjà dans le mandat.")
    membership = AssociationMembre(utilisateur, mandat, role)
    db.session.add(membership)
    db.session.commit()


def add_mandat(association: Association, nom: str, position: int):
    """
    Crée un nouveau mandat pour l'association.
    Copie physiquement le logo et la bannière du dernier mandat (par position) s'il existe.
    """
    association = Association.query.get(association.id)
    if association:
        mandat = AssociationMandat(association, nom, position)

        # Copier le logo/bannière du mandat actuel
        mandat_actuel = AssociationMandat.query.filter_by(
            association_id=association.id,
            actuel=True
        ).first()
        
        db.session.add(mandat)
        db.session.flush()  # To get the mandat.id generated

        if mandat_actuel:
            def duplicate_media(media_id):
                if not media_id:
                    return None
                old_media = db.session.get(ElementMedia, media_id)
                if not old_media:
                    return None
                
                # S'il s'agit d'un lien distant, on copie juste la référence dans un nouvel objet ElementMedia
                if old_media.file_path.startswith("http://") or old_media.file_path.startswith("https://"):
                    new_media = ElementMedia(
                        utilisateur_id=old_media.utilisateur_id,
                        file_path=old_media.file_path,
                        cache=old_media.cache,
                        protege=old_media.protege,
                        nom=old_media.nom,
                        mandat_id=mandat.id
                    )
                    db.session.add(new_media)
                    db.session.flush()
                    return new_media.id

                # Copie physique sur le disque
                old_full_path = os.path.join(Config.UPLOAD_BASE_FOLDER, old_media.file_path)
                if not os.path.exists(old_full_path):
                    # Si le fichier physique n'existe pas, on retourne None ou on copie juste l'ancien media ?
                    # Mieux vaut retourner l'ancien ID si le fichier est perdu, ou None. Retournons None.
                    return None
                
                # Génération d'un nouveau nom de fichier avec timestamp
                directory, filename = os.path.split(old_media.file_path)
                name, ext = os.path.splitext(filename)
                
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                new_filename = f"{name}_copy_{timestamp}{ext}"
                new_file_path = os.path.join(directory, new_filename).replace('\\', '/')
                
                new_full_path = os.path.join(Config.UPLOAD_BASE_FOLDER, new_file_path)
                
                # Copie du fichier
                shutil.copy2(old_full_path, new_full_path)
                
                new_media = ElementMedia(
                    utilisateur_id=old_media.utilisateur_id,
                    file_path=new_file_path,
                    cache=old_media.cache,
                    protege=old_media.protege,
                    nom=old_media.nom,
                    mandat_id=mandat.id
                )
                db.session.add(new_media)
                db.session.flush()
                return new_media.id
            
            mandat.logo_id = duplicate_media(mandat_actuel.logo_id)
            mandat.banniere_id = duplicate_media(mandat_actuel.banniere_id)

        db.session.commit()
        return True
    else:
        raise ValueError("L'association n'existe pas")


def del_mandat(mandat: int):
    """
    Supprime le mandat
    """
    membres = AssociationMembre.query.filter_by(mandat_id = mandat.id).all ()
    for m in membres:
        db.session.delete(m)
    # Supprimer les médias associés au mandat de la base de données.
    # Note : Les fichiers physiques correspondants sont volontairement conservés sur le disque dur.
    for media in mandat.media:
        db.session.delete(media)
    db.session.delete(mandat)
    db.session.commit()
    return True

def modifier_mandat(mandat: AssociationMandat, nom: str, position: int, actuel: bool):
    """
    Modifie le nom et la position du mandat
    """
    try:
        mandat.nom = nom
        mandat.position = position
        mandat.actuel = actuel
        db.session.add(mandat)
        db.session.commit()
        return True
    except:
        return None

def remove_member(mandat: AssociationMandat, utilisateur: Utilisateur):
    """
    Retire un membre de l'association
    Renvoie une erreur si l'utilisateur ou l'association n'existe pas
    Ne renvoie pas d'erreur si l'utilisateur n'est pas membre de l'association
    """

    membership = AssociationMembre.query.filter_by(
        utilisateur_id=utilisateur.id,
        mandat_id=mandat.id
    ).first()

    if membership:
        db.session.delete(membership)
        db.session.commit()
    else:
        raise ValueError("L'utilisateur n'est pas dans l'association")



def update_member(mandat: AssociationMandat, utilisateur: Utilisateur, role: str, position: int, admin: bool):
    """
    Modifie le role d'un membre de l'association
    Renvoie une erreur si l'utilisateur ou l'association n'existe pas
    Ne renvoie pas d'erreur si l'utilisateur n'est pas membre de l'association
    """
    if mandat:
        if utilisateur:
            membership = AssociationMembre.query.filter_by(
                utilisateur_id=utilisateur.id,
                mandat_id=mandat.id
            ).first()
            if membership:
                membership.role = role
                membership.position = position
                if is_admin_asso(current_user, mandat.association_id):
                    membership.admin = admin
                db.session.commit()
            else:
                raise ValueError("L'utilisateur n'est pas dans le mandat")
        else:
            raise ValueError("L'utilisateur n'existe pas")
    else:
        raise ValueError("Le mandat n'existe pas")


def get_asso_media(asso_id):
    asso = Association.query.get(asso_id)
    if not asso:
        return []
    
    files = []
    for mandat in asso.mandats:
        files.extend([m for m in mandat.media if not m.cache])
    return [f.to_dict() for f in files]


def is_admin_asso(utilisateur: Utilisateur, association_id: int):
    return any(role.admin for role in utilisateur.associations if role.mandat.association_id == association_id) or current_user.est_superutilisateur