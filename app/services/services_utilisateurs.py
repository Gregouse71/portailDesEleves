# importer les models grace a __init__.py de models
from app.services import db
from app.models.models_utilisateurs import Utilisateur
from app.models.models_sondages import VoteSondage, Sondage

from datetime import date, timedelta
from itertools import groupby
from math import exp

# Erreur levee si l'une de ces fonctions echoue
class ErreurDeLienUtilisateurs(Exception):
    def __init__(self, message):
        super().__init__(message)

# CO

def get_utilisateur(utilisateur_id) -> Utilisateur:  
    """Renvoie un utilisateur depuis son id"""
    if utilisateur_id:
        return db.session.get(Utilisateur, utilisateur_id)
    else:
        return None

def supprimer_co(utilisateur1:Utilisateur, utilisateur2:Utilisateur) :
    """
    Supprime le lien de colocation entre les deux utilisateurs. 
    Leve si les deux utilisateurs ne sont pas co
    """
    if utilisateur1.co == utilisateur2 and utilisateur2.co == utilisateur1 : # les deux sont co
            utilisateur1.co = None
            utilisateur2.co = None
    else :
        raise ErreurDeLienUtilisateurs("Erreur : les deux utilisateurs ne sont pas co.") # sinon erreur
    

def creer_co(utilisateur1:Utilisateur, utilisateur2:Utilisateur) :
    """
    Crée un lien de colocation entre deux utilisateurs en modifiant leurs attributs.
    Si l'un des deux utilisateurs avait deja un co, le lien precedent est detruit. 
    """
    # Verifier que les deux utilisateurs ne sont pas deja co
    if utilisateur1.co_id == utilisateur2.id and utilisateur2.co_id == utilisateur1.id:
        return

    # Casser les anciennes relations
    if utilisateur1.co:
        utilisateur1.co.co = None
    if utilisateur2.co:
        utilisateur2.co.co = None

    # Mettre en place la nouvelle relation
    utilisateur1.co = utilisateur2
    utilisateur2.co = utilisateur1

    db.session.commit()

# PARRAINAGE

def ajouter_fillots_a_la_famille(marrain:Utilisateur, liste_fillots:list[Utilisateur]) :
    """
    Ajoute une liste de fillots a la famille. 
    Si l'un des fillots possede deja un marrain, le lien est detruit. 
    """
    fillots_a_ajouter = []
    for fillot in liste_fillots:
        # si le fillot a un marrain qui n'est pas le marrain actuel
        if fillot.marrain is not None and fillot.marrain.id != marrain.id:
            fillot.marrain = None
            fillots_a_ajouter.append(fillot)
        # si le fillot n'a pas de marrain
        elif fillot.marrain is None:
            fillots_a_ajouter.append(fillot)
        # si le fillot a déjà le marrain actuel comme marrain, on ne fait rien

    # modification
    marrain.fillots.extend(fillots_a_ajouter)
    db.session.commit()


def supprimer_fillots(marrain:Utilisateur) :
    """
    Supprime les fillots d'un utilisateur. Ne renvoie pas d'erreur si l'utilisateur n'a pas de fillot. 
    Supprime donc en consequence le marrain des fillots concernes
    """
    if marrain.fillots:
        marrain.fillots = []
        db.session.commit()

def changer_marrain(marrain:Utilisateur, fillot:Utilisateur):
    """
    Change le marrain d'un fillot.
    Si le fillot avait déjà un marrain, le lien est détruit.
    """
    fillot.marrain = marrain
    db.session.commit()

# AUTRES

def prochains_anniv():
    def must_display(d):
        date1 = date(year=2000, month=d.month, day=d.day)
        date2 = date(year=2000, month=date.today().month, day=date.today().day)

        return (date2 <= date1 <= date2 + timedelta(days=7)
                or date2 <= date1 + timedelta(days=365) <= date2 + timedelta(days=7))

    users = db.session.query(Utilisateur.id, Utilisateur.prenom, Utilisateur.nom, Utilisateur.cycle, Utilisateur.promotion, Utilisateur.date_de_naissance).all()
    ret = sorted([(user.date_de_naissance, user.prenom, user.nom, user.cycle, user.promotion, user.id) for user in users if must_display(user.date_de_naissance)])
    ret = [(k, list(map(lambda x: (x[1], x[2], x[3], x[4], x[5]), list(g)))) for k, g in groupby(ret, lambda x: x[0])]
    print (ret)
    return ret