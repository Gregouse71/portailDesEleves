from flask import jsonify
from werkzeug.utils import secure_filename
import uuid
import os

from app.services import db
from app.models.models_utilisateurs import Utilisateur
from app.models.models_associations import Association
from app.models.models_media import ElementMedia


def upload_media(file, dir: str, user_id: int=None, asso_id: int=None, cache=False):
    """
    Crée un fichier pour l'utilisateur/association.
    Si user_id est non nul, asso_id est ignoré.
    Si asso_id et user_id sont nuls, aucun fichier n'est créé
    """
    if file.filename == '':
        return jsonify({"message": "Aucun fichier n'a été sélectionné"}), 400
    if asso_id is not None and user_id is not None:
        return jsonify({"message": "Le fichier ne peut pas être associé à un utilisateur et une asso"}), 400

    if file:
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        uid = uuid.uuid4()

        unique_filename = f"{name}_{uid}{ext}"

        path = os.path.join(dir, unique_filename)
        media = ElementMedia(user_id, asso_id, path, cache=cache)
        db.session.add(media)
        db.session.commit()

        UPLOAD_FOLDER = os.path.join('upload', dir)
        if not os.path.exists(UPLOAD_FOLDER):
            try:
                os.makedirs(UPLOAD_FOLDER)
            except FileExistsError:
                pass

        path = os.path.join('upload', path)
        file.save(path)
        return media


def delete_media(media: ElementMedia):
    path = os.path.join('upload', media.file_path)
    try:
        os.remove(path)
    except FileNotFoundError:
        pass
    db.session.delete(media)
    db.session.commit()
