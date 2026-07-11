from app.services import db
from app.services.services_global import get_global_var, set_global_var
from app.models import Utilisateur, ConsoSoifguard, Permission
from app.models.models_soifguard import OperationSoifguard
from app.services.modules.services_cotisations import est_cotisant_octo, est_cotisant_biero
from sqlalchemy import or_, desc, asc


def _encaisser(utilisateur: Utilisateur, auteur: Utilisateur, prix: float, asso: str, nom_conso: str):
    max_negatif = get_global_var("max_negatif_octo") if asso == 'octo' else get_global_var("max_negatif_biero")
    solde_actuel = utilisateur.solde_octo if asso == "octo" else utilisateur.solde_biero
    est_cotisant = est_cotisant_octo(utilisateur.id) if asso == "octo" else est_cotisant_biero(utilisateur.id)

    nouveau_solde = float(solde_actuel) - float(prix)
    if max_negatif is not None and nouveau_solde <= max_negatif:
        return None

    operation = OperationSoifguard(
        asso, utilisateur, auteur, est_cotisant, 
        f"{nom_conso} {"" if est_cotisant else "non "} cotisant",
        -prix
    )
    db.session.add(operation)

    if asso == "octo":
        utilisateur.solde_octo = nouveau_solde
    else:
        utilisateur.solde_biero = nouveau_solde

    db.session.commit()
    return utilisateur.to_dict()


def encaisser_utilisateur(utilisateur: Utilisateur, auteur: Utilisateur, conso: ConsoSoifguard) :
    """
    Encaisse un utilisateur a l'octo ou a la biero selon le prix de la conso, s'il est cotisant ou non, 
    si sa dette ne depasse pas la dette maximale autorisee par l'asso. 
    Renvoie le nouvel état de l'utilisateur
    """
    if conso.prix_cotisant is not None and (
            (conso.asso == 'octo' and est_cotisant_octo(utilisateur.id)) 
         or (conso.asso == 'biero' and est_cotisant_biero(utilisateur.id))
        ):
            return _encaisser(utilisateur, auteur, conso.prix_cotisant, conso.asso, conso.nom_conso)
    else :
        return _encaisser(utilisateur, auteur, conso.prix, conso.asso,  conso.nom_conso)

def crediter_utilisateur(utilisateur: Utilisateur, auteur: Utilisateur, somme: str, asso: str):
    """
    credite le compte octo ou biero d'un utilisateu. La somme peut etre positive (gain) ou negative (perte)
    Renvoie un message de log
    """
    solde_actuel = utilisateur.solde_octo if asso == "octo" else utilisateur.solde_biero
    est_cotisant = est_cotisant_octo(utilisateur.id) if asso == "octo" else est_cotisant_biero(utilisateur.id)
    nouveau_solde = float(solde_actuel) + float(somme)

    operation = OperationSoifguard(
        asso, utilisateur, auteur, est_cotisant, 
        "crédit",
        somme
    )

    if asso == 'octo' :
        utilisateur.solde_octo = nouveau_solde
    else:
        utilisateur.solde_biero = nouveau_solde

    db.session.add(operation)
    db.session.commit()
    return utilisateur.to_dict()

def fixer_negatif_maximum(asso:str, maximum:int) :
    """
    La dette maximale autorisee. Il sera impossible d'encaisser quelqu'un en dessous de cette dette
    pour une dette maximale de 10 euros, mettre maximum=10
    """
    if maximum < 0 :
        raise ValueError("La dette maximale doit etre positive ou nulle")
    if asso == 'octo' :
        set_global_var('max_negatif_octo', maximum)
    elif asso == 'biero' :
        set_global_var('max_negatif_biero', maximum)
    else :
        raise ValueError("asso doit etre 'octo' ou 'biero'")
    db.session.commit()
    return maximum

def ajouter_nouvelle_conso(nom_conso:str, asso:str, prix:float, prix_cotisant:float=None) :
    conso = ConsoSoifguard(nom_conso=nom_conso, asso=asso, prix=prix, prix_cotisant=prix_cotisant)
    db.session.add(conso)
    db.session.commit()
    return conso.to_dict()

def supprimer_conso(conso: ConsoSoifguard):
    db.session.delete(conso)
    db.session.commit()
    return conso.to_dict()

def modifier_conso(conso: ConsoSoifguard, data) :
    """
    Modifie le prix de la conso. Si prix cotisant n'existe pas ou est egal a nouveau prix, le met a None
    """
    conso = conso.patch(data)
    db.session.commit()
    return conso.to_dict()

def liste_des_consos():
    """
    Charge la liste des consos de la biero ou de l'octo
    """
    return {
        key: [row.to_dict() for row in ConsoSoifguard.query.filter_by(asso=key).all()]
        for key in ["octo", "biero"]
    }

def liste_operations(asso: str, page: int=0, per: int=20, query: str = ""):
    """
    Renvoie la liste des opérations récentes
    """
    query_obj = OperationSoifguard.query.filter_by(asso=asso)

    if query:
        query_obj = query_obj.join(OperationSoifguard.utilisateur).filter(
            or_(
                Utilisateur.nom_utilisateur.ilike(f"%{query}%"),
                Utilisateur.prenom.ilike(f"%{query}%"),
                Utilisateur.nom.ilike(f"%{query}%"),
                Utilisateur.surnom.ilike(f"%{query}%")
            )
        )

    page_res = query_obj.order_by(OperationSoifguard.date.desc()).paginate(page=page, per_page=per)

    return {"operations": [o.to_dict() for o in page_res], "count": page_res.total}


def get_permissions(page: int, per_page: int, query_str: str="", asso: str="biero"):
    """
    Récupère tous les utilisateurs avec leurs permissions, avec pagination.
    """
    query = Permission.query.filter(Permission.permission.ilike(f"%{asso}%"))
    if len(query_str) >= 1:
        query = query.join(Permission.utilisateur).filter(
            Utilisateur.nom_utilisateur.ilike(f"%{query_str}%")
        )
    perms = query.paginate(page=page, per_page=per_page, error_out=False)
    return {"permissions": [p.to_dict() for p in perms], "count": perms.total}


def liste_utilisateurs(page: int, perPage: int="all", asso: str="octo", name: str="", orderBy: str="", orderAsc: bool=True, return_users: bool=False):
    query = db.session.query(Utilisateur).filter(Utilisateur.promotion != "00")

    if len(name) > 0:
        query = query.filter(
            or_(
                Utilisateur.nom_utilisateur.ilike(f"%{name}%"),
                Utilisateur.prenom.ilike(f"%{name}%"),
                Utilisateur.nom.ilike(f"%{name}%"),
                Utilisateur.surnom.ilike(f"%{name}%")
            )
        )

    fun = asc if orderAsc else desc
    if orderBy == "solde":
        query = query.order_by(fun(Utilisateur.solde_octo)) if asso == "octo" else query.order_by(fun(Utilisateur.solde_biero))
    if orderBy == "promotion":
        query = query.order_by(fun(Utilisateur.promotion))


    if perPage == "all":
        users = query.all()
        return {"utilisateurs": [o if return_users else o.id for o in users], "count": len(users)}
    else:
        page_res = query.paginate(page=page, per_page=perPage, error_out=False)
        return {"utilisateurs": [o if return_users else o.id for o in page_res], "count": page_res.total}