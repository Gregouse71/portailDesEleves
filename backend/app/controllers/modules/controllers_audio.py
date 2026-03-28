from flask import Blueprint, request, jsonify
from flask_login import login_required
from werkzeug.utils import secure_filename
import os
from datetime import datetime, timezone

from app.services.modules.services_audio import get_albums_for_association, add_album, get_album, delete_album, update_audio, update_album, add_audio, get_audio, delete_audio
from app.services.services_associations import get_association
from app.models.modules.models_audio import AssoAlbum
from app.utils.decorators import est_membre_de_asso

from config import Config

controllers_audio = Blueprint('controllers_audio', __name__)

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'ogg', 'flac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@controllers_audio.get('/album/<int:id>')
@login_required
def get_album_by_id(id):
    """Gets all albums and their nested songs for an association."""
    album = AssoAlbum.query.get(id)
    if not album:
        return jsonify({"message": "Association not found"}), 404

    return jsonify(album.to_dict())

# Album Routes
@controllers_audio.route('/<int:association_id>/albums', methods=['GET'])
@login_required
def route_get_albums(association_id):
    """Gets all albums and their nested songs for an association."""
    asso = get_association(association_id)
    if not asso:
        return jsonify({"message": "Association not found"}), 404

    return jsonify(get_albums_for_association(association_id))

@controllers_audio.route('/<int:association_id>/album', methods=['POST'])
@login_required
@est_membre_de_asso(actuel=True)
def route_add_album(association_id):
    """Adds a new album."""
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"success": False, "message": "Le nom de l'album est requis"}), 400

    new_album = add_album(name=data['name'], association_id=association_id)
    if new_album:
        return jsonify({"success": True, "message": "Album ajouté avec succès", "album": {"id": new_album.id, "name": new_album.name, "position": new_album.position, "audios": []}}), 201
    return jsonify({"success": False, "message": "Erreur lors de l'ajout de l'album"}), 500

@controllers_audio.route('/<int:association_id>/album/<int:album_id>', methods=['PATCH'])
@login_required
@est_membre_de_asso(actuel=True)
def route_update_album(association_id, album_id):
    """Updates an album's name and position."""
    data = request.get_json()
    name = data.get('name')
    position = data.get('position')

    if not name or position is None:
        return jsonify({"success": False, "message": "Le nom et la position sont requis"}), 400

    album = get_album(album_id)
    if not album or album.association_id != association_id:
        return jsonify({"success": False, "message": "Album introuvable ou non associé à cette association"}), 404

    if update_album(album_id, name, position):
        return jsonify({"success": True, "message": "Album mis à jour."}), 200
    return jsonify({"success": False, "message": "Erreur lors de la mise à jour."}), 500

@controllers_audio.route('/album/<int:association_id>/<int:album_id>', methods=['DELETE'])
@login_required
@est_membre_de_asso(actuel=True)
def route_delete_album(association_id, album_id):
    """Deletes an album."""
    album = get_album(album_id)
    if not album or album.association_id != association_id:
        return jsonify({"success": False, "message": "Album introuvable ou non associé à cette association"}), 404

    if delete_album(album_id):
        return jsonify({"success": True, "message": "Album supprimé avec succès."}), 200
    return jsonify({"success": False, "message": "Erreur lors de la suppression."}), 500

# Audio (Song) Routes
@controllers_audio.route('/<int:association_id>/album/<int:album_id>/audio', methods=['POST'])
@login_required
@est_membre_de_asso(actuel=True)
def route_add_audio(association_id, album_id):
    """Adds a new song to a specific album."""
    album = get_album(album_id)
    if not album or album.association_id != association_id:
        return jsonify({"success": False, "message": "Album introuvable ou non associé à cette association"}), 404

    asso = get_association(association_id)
    if not asso:
        return jsonify({"success": False, "message": "Association parente introuvable"}), 404

    if 'file' not in request.files or 'nom' not in request.form:
        return jsonify({"success": False, "message": "Les champs 'file' et 'nom' sont requis"}), 400

    file = request.files['file']
    nom = request.form.get('nom')

    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Fichier invalide ou non autorisé"}), 400

    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    unique_filename = f"{name}_{timestamp}{ext}"

    media_folder = os.path.join(Config.UPLOAD_BASE_FOLDER, 'associations', asso.nom_dossier, 'media')
    os.makedirs(media_folder, exist_ok=True)
    full_path = os.path.join(media_folder, unique_filename)
    file.save(full_path)

    new_audio = add_audio(
        nom=nom,
        file_path=unique_filename,
        association_id=asso.id,
        album_id=album_id
    )

    if new_audio:
        return jsonify({"success": True, "message": "Son ajouté avec succès", "audio": {"id": new_audio.id, "nom": new_audio.nom, "position": new_audio.position, "file_path": f"associations/{asso.nom_dossier}/media/{new_audio.file_path}"}}), 201

    if os.path.exists(full_path):
        os.remove(full_path)
    return jsonify({"success": False, "message": "Erreur lors de l'ajout du son"}), 500

@controllers_audio.route('/<int:association_id>/audio/<int:audio_id>', methods=['DELETE'])
@login_required
@est_membre_de_asso(actuel=True)
def route_delete_audio(association_id, audio_id):
    """Deletes a song."""
    audio = get_audio(audio_id)
    if not audio or audio.association_id != association_id:
        return jsonify({"success": False, "message": "Son introuvable ou non associé à cette association"}), 404

    if delete_audio(audio_id):
        return jsonify({"success": True, "message": "Son supprimé avec succès"}), 200

    return jsonify({"success": False, "message": "Erreur lors de la suppression du son"}), 500

@controllers_audio.route('/<int:association_id>/audio/<int:audio_id>', methods=['PATCH'])
@login_required
@est_membre_de_asso(actuel=True)
def route_update_audio(association_id, audio_id):
    """Updates an audio's name and position."""
    data = request.get_json()
    name = data.get('name')
    position = data.get('position')

    if not name or position is None:
        return jsonify({"success": False, "message": "Le nom et la position sont requis"}), 400

    audio = get_audio(audio_id)
    if not audio or audio.association_id != association_id:
        return jsonify({"success": False, "message": "Son introuvable ou non associé à cette association"}), 404

    if update_audio(audio_id, name, position):
        return jsonify({"success": True, "message": "Son mis à jour."}), 200
    return jsonify({"success": False, "message": "Erreur lors de la mise à jour."}), 500