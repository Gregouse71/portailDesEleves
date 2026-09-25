# Services de la brique API annuaire : gate d'âge (2A+) et vérification de clé.
#
# « 2A au Mines » = l'élève du cycle est entré AVANT la promotion entrante.
# `promotion` est un string numérique (2 chiffres observés : "25", "26" ; le
# modèle tolère 4). On normalise sur les 2 derniers chiffres. La promotion des
# 1A courants = année de la dernière rentrée (septembre = bascule) % 100.
# Les superutilisateurs passent la gate (VP Geek, quelle que soit leur promo).

from datetime import datetime

from app.models.models_cles_api import CleAPI, hash_cle
from app.models.models_utilisateurs import Utilisateur


def promo_1a_actuelle():
    """Promotion des 1A en cours (string 2 chiffres, ex "26")."""
    maintenant = datetime.now()
    annee_rentree = maintenant.year if maintenant.month >= 8 else maintenant.year - 1
    return str(annee_rentree % 100)


def _promo_int(promotion):
    try:
        return int(str(promotion)[-2:])
    except (TypeError, ValueError):
        return None


def est_2a_et_plus(utilisateur):
    """True si l'utilisateur est 2A ou plus (ou superutilisateur)."""
    if utilisateur is None:
        return False
    if getattr(utilisateur, "est_superutilisateur", False):
        return True
    promo = _promo_int(utilisateur.promotion)
    if promo is None:
        return False
    return promo < _promo_int(promo_1a_actuelle())


def cle_valide(valeur):
    """Renvoie la CleAPI active correspondant à la valeur, ou None."""
    if not valeur:
        return None
    return CleAPI.query.filter_by(hash=hash_cle(valeur), revoked=False).first()
