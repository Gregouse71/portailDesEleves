from flask import Blueprint, request, jsonify, abort, send_file
from flask_login import login_required, current_user
from sqlalchemy import distinct, desc
import csv
import io

from app import db
from app.models import Utilisateur, ConsoSoifguard, Permission, OperationSoifguard
from app.services.services_soifguard import encaisser_utilisateur, crediter_utilisateur, fixer_negatif_maximum, ajouter_nouvelle_conso, supprimer_conso, modifier_conso, liste_des_consos, liste_operations, get_permissions, liste_utilisateurs
from app.services.services_global import get_global_var
from app.services.modules.services_cotisations import toggle_cotisation_biero, toggle_cotisation_octo, est_cotisant_biero
from app.utils.decorators import a_permission
from app.services.services_login import has_permission

# Creer le blueprint pour soifguard
controllers_soifguard = Blueprint('controllers_soifguard', __name__)


@controllers_soifguard.post('/encaisser/<string:asso>')
@login_required
@a_permission("admin_octo", "octo", "admin_biero", "biero")
def encaisser_octo(asso: str):
    """
    Quand on consomme
    """
    data = request.json
    utilisateur = Utilisateur.query.get(data['id_utilisateur'])
    conso = ConsoSoifguard.query.get(data['id_conso'])
    if not utilisateur or not conso:
        return jsonify({"message": "Utilisateur ou conso introuvable"}), 404

    if conso.asso == "octo" or conso.asso == "biero":
        return jsonify(encaisser_utilisateur(utilisateur, current_user, conso))

    return jsonify({"message": "Asso invalide"}), 400

@controllers_soifguard.post('/crediter/<string:asso>')
@login_required
@a_permission("admin_octo", "admin_biero")
def crediter_octo(asso: str):
    """
    Quand on mets de l'argent sur le compte
    """
    data = request.json
    somme = data.get("somme")
    if not somme:
        abort(400)
    try:
        somme = float(somme)
    except ValueError:
        abort(400)
    utilisateur = Utilisateur.query.get(data['id_utilisateur'])
    if not utilisateur:
        return jsonify({"success": False, "message": "Utilisateur introuvable"}), 404
    
    return jsonify(crediter_utilisateur(utilisateur, current_user, somme, asso))

@controllers_soifguard.post('/fixer_negatif_maximum/<string:asso>')
@login_required
@a_permission("admin_octo", "admin_biero")
def fixer_maximum(asso: str):
    data = request.json
    try:
        return jsonify(fixer_negatif_maximum(asso, data['maximum']))
    except ValueError as e:
        return jsonify({"success": False, "message": str(e)}), 400

@controllers_soifguard.post('/conso')
@login_required
@a_permission("admin_octo", "admin_biero")
def post_conso():
    """
    Crée une consommation possible
    """
    data = request.json
    asso = data["asso"]
    if asso not in ["octo", "biero"]:
        return jsonify({"message": "Asso incorrecte"}), 400
    return jsonify(ajouter_nouvelle_conso(data['nom_conso'], asso, data['prix'], data.get('prix_cotisant')))

@controllers_soifguard.delete('/conso/<int:id>')
@login_required
@a_permission("admin_octo", "admin_biero")
def delete_conso(id: int):
    """
    Supprime une consommation
    """
    conso = ConsoSoifguard.query.get(id)
    if not conso:
        return jsonify({"success": False, "message": "Conso introuvable"}), 404
    return jsonify(supprimer_conso(conso))

@controllers_soifguard.put('/conso/<int:id>')
@login_required
@a_permission("admin_octo", "admin_biero")
def put_conso(id: int):
    """
    Modifie une conso
    """
    data = request.json
    conso = ConsoSoifguard.query.get(id)
    if not conso:
        return jsonify({"success": False, "message": "Conso introuvable"}), 404

    return jsonify(modifier_conso(conso, data))

@controllers_soifguard.get('/liste_consos')
@login_required
def liste_consos():
    return jsonify(liste_des_consos())

@controllers_soifguard.put('/toggle_cotisation/<int:id_utilisateur>')
@login_required
@a_permission("admin_octo", "octo", "admin_biero", "biero")
def switch_cotisation_octo(id_utilisateur:int) :
    """
    Rend cotisant un utilisateur non cotisant, et rend non cotisant un utilisateur cotisant
    """
    data = request.json
    asso = data.get("asso")

    if asso not in ["octo", "biero"]:
        return jsonify({"message":"utilisateur introuvable ou asso invalide"}), 400

    if asso == "octo":
        user = toggle_cotisation_octo(id_utilisateur)
    elif asso == "biero":
        user = toggle_cotisation_biero(id_utilisateur)
    return jsonify({"message": "Cotisation modifiée avec succès"}), 200

@controllers_soifguard.route('/get_negatif_max/<string:asso>', methods=['GET'])
@login_required
def get_negatif_max(asso:str) :
    """
    Donne le neagtif maximal autorisé pour octo ou biero
    """
    if asso == 'octo' :
        return jsonify(get_global_var("max_negatif_octo")), 200
    elif asso == 'biero' :
        return jsonify(get_global_var("max_negatif_biero")), 200
    else :
        return jsonify({"message": "erreur : asso doit etre octo ou biero"}), 400


@controllers_soifguard.post('/operations')
@login_required
@a_permission("admin_octo", "admin_biero")
def get_liste_operations():
    """
    Renvoie la liste des opérations récentes
    """
    data = request.json
    page = data.get("page", 0)
    per = data.get("per", 20)
    asso = data.get("asso", "")
    query = data.get("query", "")

    return jsonify(liste_operations(asso, page=page, per=per, query=query)), 200


@controllers_soifguard.get("/permissions")
@a_permission("admin_octo", "admin_biero")
def get_get_permissions():
    """
    Renvoie la liste des utilisateurs avec leurs permissions, avec pagination.
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    query = request.args.get('query', "", type=str)
    asso = request.args.get('asso', "", type=str)
    if not ((asso == "octo" and has_permission(current_user, "admin_octo")) or (asso == "biero" and has_permission(current_user, "admin_biero")) or current_user.est_superutilisateur):
        abort(403)
    return jsonify(get_permissions(page, per_page, query, asso)), 200

@controllers_soifguard.delete("/permissions/<int:id>")
@a_permission("admin_octo", "admin_biero")
def delete_permission (id):
    """
    Supprime la permission
    """
    perm = Permission.query.get(id)
    if not perm:
        abort(404)
    if not (("octo" in perm.permission and has_permission(current_user, "admin_octo")) or ("biero" in perm.permission and has_permission(current_user, "admin_biero")) or current_user.est_superutilisateur):
        abort(403)
    db.session.delete(perm)
    d = perm.to_dict()
    db.session.commit()
    return jsonify(d)

@controllers_soifguard.post('/permissions')
@a_permission("admin_octo", "admin_biero")
def update_permissions():
    """
    Met à jour les permissions d'un utilisateur.
    """
    data = request.get_json()
    user_id = data.get('user_id')
    permission = data.get('permission')

    if user_id is None or permission is None:
        return jsonify({"message": "user_id et permissions requis"}), 400
    user = Utilisateur.query.get(user_id)

    if not user:
        return jsonify({"message": "L'utilisateur n'existe pas"}), 400
    print(has_permission(current_user, "admin_biero"))
    if not (("octo" in permission and has_permission(current_user, "admin_octo")) or ("biero" in permission and has_permission(current_user, "admin_biero")) or current_user.est_superutilisateur):
        print("A")
        abort(403)

    try:
        perm = Permission(user, permission)
        db.session.add(perm)
        db.session.commit()
        return jsonify(perm.to_dict()), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 404


@controllers_soifguard.get('/derniers')
@a_permission("octo", "biero", "admin_octo", "admin_biero")
def derniers_utilisateurs():
    limit = request.args.get('limit', 10)
    asso = request.args.get('asso', "octo")

    users = db.session.query(distinct(Utilisateur.id)
    ).join(OperationSoifguard, Utilisateur.id == OperationSoifguard.utilisateur_id).filter(
        Utilisateur.id == OperationSoifguard.utilisateur_id,
        OperationSoifguard.asso == asso
    ).order_by(desc(OperationSoifguard.date)).limit(limit).all()


    return jsonify([db.session.query(Utilisateur).get(u[0]).to_dict() for u in users])


@controllers_soifguard.get('/liste')
@a_permission("octo", "biero", "admin_octo", "admin_biero")
def get_liste_utilisateurs():
    data = request.args
    page = int(data.get('page', 1))
    perPage = int(data.get('perPage', 10))
    asso = data.get('asso', "octo")
    query = data.get("query", "")
    orderBy = data.get("orderBy")
    orderAsc = data.get("orderAsc", "f")[0] != "f"

    return jsonify(liste_utilisateurs(page=page, perPage=perPage, asso=asso, name=query, orderBy=orderBy, orderAsc=orderAsc))


@controllers_soifguard.get('/liste/export')
@login_required
@a_permission("octo", "biero", "admin_octo", "admin_biero")
def export_liste_utilisateurs_csv():
    asso = request.args.get('asso', "octo")
    query = request.args.get("query", "")
    orderBy = request.args.get("orderBy")
    orderAsc = request.args.get("orderAsc", "f")[0] != "f"

    # Fetch all users using the modified liste_utilisateurs function
    result = liste_utilisateurs(page=1, perPage="all", asso=asso, name=query, orderBy=orderBy, orderAsc=orderAsc, return_users=True)
    users = result["utilisateurs"]

    # Prepare CSV data
    proxy = io.StringIO()

    fieldnames = ["id", "prenom", "nom", "promotion", "email", "solde_octo", "solde_biero", "est_cotisant_biero"]
    writer = csv.DictWriter(proxy, fieldnames=fieldnames)
    writer.writeheader()

    for user in users:
        row = {}
        for col in fieldnames:
            if col != "est_cotisant_biero":
                row[col] = getattr(user, col)
        row["est_cotisant_biero"] = est_cotisant_biero(user.id)
        writer.writerow(row)

    proxy.seek(0)

    mem = io.BytesIO()
    mem.write(proxy.getvalue().encode('utf-8'))
    mem.seek(0)
    proxy.close()

    return send_file(
        mem,
        mimetype='application/csv',
        as_attachment=True,
        download_name='octo_biero.csv'
    )
