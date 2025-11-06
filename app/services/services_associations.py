# importer les models grace a __init__.py de models
from app.services import db
from app.models.models_associations import Association, AssociationMandat, AssociationMembre
from app.models.models_utilisateurs import Utilisateur
from sqlalchemy.orm.attributes import flag_modified


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


def add_mandat(association: Association, nom: str):
    """
    Crée un nouveau mandat pour l'association
    """
    association = Association.query.get(association.id)
    if association:
        mandat = AssociationMandat(association, nom)
        db.session.add(mandat)
        db.session.commit()
        return True
    else:
        raise ValueError("L'association n'existe pas")


def update_mandat_name(mandat: AssociationMandat, nom: str):
    """
    Modifie le nom d'un mandat
    """
    if mandat:
        mandat.nom = nom
        db.session.commit()
    else:
        raise ValueError("Le mandat n'existe pas")


def del_mandat(mandat: int):
    """
    Supprime le mandat
    """
    membres = AssociationMembre.query.filter_by(mandat_id = mandat.id).all ()
    for m in membres:
        db.session.delete(m)
    db.session.delete(mandat)
    db.session.commit()
    return True


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



def update_member_role(mandat: AssociationMandat, utilisateur: Utilisateur, role: str):
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
                db.session.commit()
            else:
                raise ValueError("L'utilisateur n'est pas dans le mandat")
        else:
            raise ValueError("L'utilisateur n'existe pas")
    else:
        raise ValueError("Le mandat n'existe pas")


def update_member_position(mandat: AssociationMandat, utilisateur: Utilisateur, position: int):
    """
    Modifie la position de l'utilisateur das l'association
    """
    if mandat:
        if utilisateur:
            membership = AssociationMembre.query.filter_by(
                utilisateur_id=utilisateur.id,
                mandat_id=mandat.id
            ).first()
            if membership:
                membership.position = position
                db.session.commit()
            else:
                raise ValueError("L'utilisateur n'est pas dans l'association.")
        else:
            raise ValueError("L'utilisateur n'existe pas")
    else:
        raise ValueError("Le mandat n'existe pas")
