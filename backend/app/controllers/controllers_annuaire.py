from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from app import db, limiter
from app.models.models_utilisateurs import Utilisateur
from app.services.services_cles_api import cle_valide, est_2a_et_plus

# API annuaire (brique 2026-09-25) : la base élèves du portail, consommable par
# les outils des élèves (equipaps, Pain de Mine) avec une clé personnelle 2A+.
# Auth par X-API-Key, jamais par session : c'est une API serveur-à-serveur.
# Champ STRICT : id, nom_utilisateur, prenom, nom, email, promotion, cycle,
# photo. Jamais le téléphone ni la date de naissance (RGPD).
controllers_annuaire = Blueprint('controllers_annuaire', __name__)


def _item(u):
    return {
        "id": u.id,
        "nom_utilisateur": u.nom_utilisateur,
        "prenom": u.prenom,
        "nom": u.nom,
        "email": u.email,
        "promotion": u.promotion,
        "cycle": u.cycle,
        "photo": u.get_photo_file(),   # chemin relatif upload/, à préfixer par le consommateur
    }


@controllers_annuaire.route('/liste', methods=['GET'])
@limiter.limit("60/minute")
def liste():
    cle = cle_valide(request.headers.get("X-API-Key", ""))
    if not cle:
        return jsonify({"message": "Clé API absente, invalide ou révoquée."}), 401
    if not est_2a_et_plus(cle.user):
        return jsonify({"message": "Clé réservée aux élèves 2A et plus."}), 403

    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(1000, max(1, request.args.get("per_page", 500, type=int)))

    q = Utilisateur.query.filter(Utilisateur.promotion.isnot(None))
    promo = request.args.get("promo")
    if promo:
        q = q.filter(Utilisateur.promotion == str(promo))
    cycle = request.args.get("cycle")
    if cycle:
        q = q.filter(Utilisateur.cycle == cycle)
    depuis_id = request.args.get("depuis_id", type=int)
    if depuis_id:
        q = q.filter(Utilisateur.id > depuis_id)

    total = q.count()
    pages = max(1, -(-total // per_page))
    utilisateurs = q.order_by(Utilisateur.id).offset((page - 1) * per_page).limit(per_page).all()

    # audit léger : dernière utilisation, compteur
    cle.last_used_at = datetime.now(timezone.utc).replace(tzinfo=None)
    cle.use_count = (cle.use_count or 0) + 1
    db.session.commit()

    return jsonify({
        "items": [_item(u) for u in utilisateurs],
        "total": total,
        "page": page,
        "pages": pages,
        "per_page": per_page,
    }), 200


# Anniversaires entre deux dates (MM-JJ, l'année ne compte pas) : les
# anniversaires tombant dans [du, au] inclus, avec repli de fin d'année
# (12-28 → 01-04). Même auth que l'annuaire ; ne sort JAMAIS l'année de
# naissance, seulement le mois-jour.
def _moisjour(valeur):
    try:
        m, j = valeur.split("-")
        m, j = int(m), int(j)
        if 1 <= m <= 12 and 1 <= j <= 31:
            return m * 100 + j
    except ValueError:
        pass
    return None


@controllers_annuaire.route('/anniversaires', methods=['GET'])
@limiter.limit("60/minute")
def anniversaires():
    cle = cle_valide(request.headers.get("X-API-Key", ""))
    if not cle:
        return jsonify({"message": "Clé API absente, invalide ou révoquée."}), 401
    if not est_2a_et_plus(cle.user):
        return jsonify({"message": "Clé réservée aux élèves 2A et plus."}), 403

    debut = _moisjour(request.args.get("du", ""))
    fin = _moisjour(request.args.get("au", ""))
    if debut is None or fin is None:
        return jsonify({"message": "Paramètres du et au requis au format MM-JJ (ex : du=11-06&au=11-13)."}), 400

    # audit léger : dernière utilisation, compteur
    cle.last_used_at = datetime.now(timezone.utc).replace(tzinfo=None)
    cle.use_count = (cle.use_count or 0) + 1
    db.session.commit()

    # Périmètre identique au widget du portail (prochains_anniv) : les 4
    # dernières promos par défaut — toute la base (anciens compris) avec
    # toutes=1.
    promos_gardees = None
    if request.args.get("toutes") not in ("1", "true", "True"):
        max_promo = int(db.session.query(func.max(Utilisateur.promotion)).first()[0])
        promos_gardees = {str(max_promo - i) for i in range(4)}

    def _mj(u):
        d = u.date_de_naissance
        return None if d is None else d.month * 100 + d.day

    items = []
    for u in Utilisateur.query.filter(Utilisateur.date_de_naissance.isnot(None)).all():
        if promos_gardees is not None and str(u.promotion) not in promos_gardees:
            continue
        mj = _mj(u)
        if mj is None:
            continue
        dans = (debut <= mj <= fin) if debut <= fin else (mj >= debut or mj <= fin)
        if dans:
            items.append((mj, u))

    # tri dans l'ordre du calendrier demandé (repli fin d'année : depuis debut, cycliquement)
    items.sort(key=lambda p: (p[0] - debut) % 10000)

    return jsonify({
        "du": request.args.get("du"),
        "au": request.args.get("au"),
        "total": len(items),
        "items": [{
            "id": u.id,
            "nom_utilisateur": u.nom_utilisateur,
            "prenom": u.prenom,
            "nom": u.nom,
            "promotion": u.promotion,
            "cycle": u.cycle,
            "anniversaire": f"{u.date_de_naissance.month:02d}-{u.date_de_naissance.day:02d}",
        } for _, u in items],
    }), 200
