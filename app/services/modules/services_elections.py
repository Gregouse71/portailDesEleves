import os
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import abort
from sqlalchemy.orm.attributes import flag_modified
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import base64

from app.utils.divers_utils import send_mail
from app.models.models_associations import Association
from app.models.models_associations import Utilisateur
from app.models.modules.models_elections import Election, ElectionVote, ElectionVoteChiffre
from app import db

def creer_election (asso_id, data):
    asso = Association.query.filter_by(id=asso_id).all()
    if not asso:
        return None
    if data.get("nom") is None or data.get("options") is None:
        return None

    election = Election(association=asso[0], nom=data.get("nom"), options=data.get("options"), chiffree=data.get("chiffree", False))
    election.patch(data)
    db.session.add(election)
    db.session.commit()
    return election


def patch_election(election, data):
    """
    Modifie l'objet avec les clés dans data.
    Ce qui n'est pas précisé n'est pas changé.
    """

    # Supression de simages inutiles
    for opt in election.options:
        flag_modified(election, "options")
        if opt not in data.get("options", []):
            im = opt.get("image")
            if im and len(im) > 0:
                path = os.path.join('upload', im)
                if os.path.exists(path):
                    os.remove(path)

    election.nom = data.get("nom", election.nom)
    election.description = data.get("description", election.description)
    election.visible = data.get("visible", election.visible)
    election.options = data.get("options", election.options)
    election.promos = data.get("promos", election.promos)
    election.chiffree = data.get("chiffree", election.promos)
    election.date_ouverture = data.get("date_ouverture", election.date_ouverture)
    election.date_fermeture = data.get("date_fermeture", election.date_fermeture)
    return election


def ajouter_photo(file, election, choix):
    """
    Ajoute une photo pour l'option n° *choix* de l'election,
    en supprimant d'autres deja existantes
    """
    UPLOAD_FOLDER = os.path.join('upload', 'associations', election.association.nom_dossier)
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    ALREADY = election.options[choix].get("image")
    if ALREADY:
        OLD = os.path.join('upload', ALREADY)
        if os.path.exists(OLD):
            os.remove(OLD)

    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{name}_{timestamp}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    path = os.path.join('associations', election.association.nom_dossier, filename)
    election.options[choix]["image"] = path
    flag_modified(election, "options")
    db.session.commit()
    return path


def supprimer_election(election):
    """
    Supprime l'election
    """
    for vote in election.votes:
        db.session.delete(vote)
    db.session.delete(election)
    for choix in election.options:
        im = choix.get("image")
        if im and len(im) > 0:
            path = os.path.join('upload', im)
            if os.path.exists(path):
                os.remove(path)

    db.session.commit()
    return election


mailBody = """
<html>
    <p>Ton vote à l'élection {0} pour la liste {1} <em>{2}<em> a bien été pris en compte.</p>
    <p>En pièce jointe se trouve la clé dont tu auras besoin pour vérifier que ton vote a bien été pris en compte, et le fichier python qui te permettra de faire cette vérification.</p>
    <p>Si tu n'es pas à l'origine de ce vote, contact le VP Geek pour lui signaler.</p>
    
    <div>En cas de problème, contact moi à <a href="mailto:webmaster-bde@mines-paristech.fr">webmaster-bde@mines-paristech.fr</a></div>
    <div>Le VP Geek BDE, Adria</div>
</html>
"""

def voter(choix: int, election: Election, utilisateur: Utilisateur):
    """
    Vérifie si l'utilisateur peut voter, et si c'est le cas crée
    un vote à l'élection
    """
    if utilisateur.promotion not in election.promos:
        return abort(403, message="Non electeur")
    deja = ElectionVote.query.filter_by(election_id=election.id, utilisateur_id=utilisateur.id).count()
    if deja > 0:
        return abort(403, message="Déjà voté")

    if not election.chiffree:
        vote = ElectionVote(int(choix), election, utilisateur)
        db.session.add(vote)
        db.session.commit()
        return vote
    else:
        key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=4096,
        )
        message = bytes(utilisateur.nom_utilisateur, encoding="utf-8")
        ciphertext = key.public_key().encrypt(
            message,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        vote = ElectionVote(None, election, utilisateur)
        db.session.add(vote)

        vote_chiffre = ElectionVoteChiffre(int(choix), election, base64.b64encode(ciphertext), utilisateur)
        db.session.add(vote_chiffre)
        pem = key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        )
        text = mailBody.format (election.nom, choix + 1, election.options[choix]["name"])
        send_mail(
            "no-reply@eleves.mines-paris.eu", utilisateur.email, "Vote à l'élection", text,
            attachement=(pem, "text", "plain", "key.pem")
        )

        db.session.commit()
        return vote