# app/services/modules/services_audio.py
import os
from app import db
from app.models.modules.models_audio import AssoAlbum, AssoAudio
from app.models.models_associations import Association

# Album services
def add_album(name, association_id):
    """Adds a new album to the database for a given association."""
    try:
        # New albums get the highest position + 1
        max_pos = db.session.query(db.func.max(AssoAlbum.position)).filter_by(association_id=association_id).scalar()
        position = (max_pos if max_pos is not None else -1) + 1
        
        album = AssoAlbum(
            name=name,
            association_id=association_id,
            position=position
        )
        db.session.add(album)
        db.session.commit()
        return album
    except Exception as e:
        db.session.rollback()
        print(f"Error adding album: {e}")
        return None

def get_album(album_id):
    """Gets an album by its id."""
    return db.session.get(AssoAlbum, album_id)

def get_albums_for_association(association_id):
    """Gets all albums for a given association, ordered by position."""
    return AssoAlbum.query.filter_by(association_id=association_id).order_by(AssoAlbum.position).all()

def update_album(album_id, name, position):
    """Updates the name and position of an album."""
    try:
        album = get_album(album_id)
        if not album:
            return False
        
        album.name = name
        album.position = position
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error updating album: {e}")
        return False

def delete_album(album_id):
    """Deletes an album, its associated audios records, and the corresponding audio files."""
    try:
        album = get_album(album_id)
        if not album:
            return False
        
        association = db.session.get(Association, album.association_id)
        if not association:
            print(f"Could not find association with id {album.association_id} for album {album_id}")
            return False

        media_folder = os.path.join('upload', 'associations', association.nom_dossier, 'media')

        # Loop through associated audio files and delete them from filesystem
        for audio in album.audios:
            if audio.file_path:
                full_path = os.path.join(media_folder, audio.file_path)
                if os.path.exists(full_path):
                    os.remove(full_path)
        
        # Now delete the album from DB. Associated audios will be cascade-deleted.
        db.session.delete(album)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting album: {e}")
        return False

# Audio services
def add_audio(nom, file_path, association_id, album_id):
    """Adds a new audio file record to the database."""
    try:
        max_pos = db.session.query(db.func.max(AssoAudio.position)).filter_by(album_id=album_id).scalar()
        position = (max_pos if max_pos is not None else -1) + 1
        
        audio = AssoAudio(
            nom=nom,
            file_path=file_path,
            association_id=association_id,
            album_id=album_id,
            position=position
        )
        db.session.add(audio)
        db.session.commit()
        return audio
    except Exception as e:
        db.session.rollback()
        print(f"Error adding audio: {e}")
        return None

def get_audio(audio_id):
    """Gets an audio file by its id."""
    return db.session.get(AssoAudio, audio_id)

def update_audio(audio_id, nom, position):
    """Updates the name and position of an audio."""
    try:
        audio = get_audio(audio_id)
        if not audio:
            return False
        
        audio.nom = nom
        audio.position = position
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error updating audio: {e}")
        return False

def delete_audio(audio_id):
    """Deletes an audio file from filesystem and database."""
    try:
        audio = get_audio(audio_id)
        if not audio:
            return False

        association = db.session.get(Association, audio.association_id)
        if not association:
            print(f"Could not find association with id {audio.association_id} for audio {audio_id}")
            return False

        # Delete file from filesystem
        media_folder = os.path.join('upload', 'associations', association.nom_dossier, 'media')
        if audio.file_path:
            full_path = os.path.join(media_folder, audio.file_path)
            if os.path.exists(full_path):
                os.remove(full_path)

        # Delete record from DB
        db.session.delete(audio)
        db.session.commit()
        return True
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting audio: {e}")
        return False
