from flask import jsonify
from werkzeug.utils import secure_filename
import uuid
import os
from flask_login import current_user

from app.services import db
from app.models.models_utilisateurs import Utilisateur
from app.models.models_associations import Association
from app.models.models_media import ElementMedia

from config import Config


def upload_media(file, dir: str, user_id: int=None, asso_id: int=None, cache=False, custom_filename: str=None, mandat_id: int=None):
    """
    Crée un fichier pour l'utilisateur/association.
    Si user_id est non nul, asso_id est ignoré.
    Si asso_id et user_id sont nuls, aucun fichier n'est créé
    """
    if not file or file.filename == '':
        return None
    if asso_id is not None and user_id is not None:
        return None

    if file:
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        if ext.lower() not in {'.png', '.jpg', '.jpeg', '.gif'}:
            return None
        
        if custom_filename:
            unique_filename = f"{custom_filename}{ext}"
        else:
            uid = uuid.uuid4()
            unique_filename = f"{name}_{uid}{ext}"

        path = os.path.join(dir, unique_filename).replace('\\', '/')
        media = ElementMedia(user_id, asso_id, path, cache=cache, nom=filename, mandat_id=mandat_id)
        db.session.add(media)
        db.session.commit()

        UPLOAD_FOLDER = os.path.join(Config.UPLOAD_BASE_FOLDER, dir)
        if not os.path.exists(UPLOAD_FOLDER):
            try:
                os.makedirs(UPLOAD_FOLDER)
            except FileExistsError:
                pass

        full_save_path = os.path.join(Config.UPLOAD_BASE_FOLDER, dir, unique_filename)
        file.save(full_save_path)
        return media


def delete_media(media: ElementMedia):
    print(media.protege)
    if media.protege and not current_user.est_superutilisateur:
        return False
    if not (media.file_path.startswith("http://") or media.file_path.startswith("https://")):
        path = os.path.join(Config.UPLOAD_BASE_FOLDER, media.file_path)
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
    db.session.delete(media)
    db.session.commit()
    return True