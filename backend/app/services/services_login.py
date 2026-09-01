from datetime import datetime, timedelta, timezone
from config import Config
import jwt
from argon2 import exceptions
from sqlalchemy import or_

from app.services import db
from app.utils.divers_utils import ph
from app.models.models_utilisateurs import Utilisateur
from app.models.models_divers import Permission
from app.utils.divers_utils import send_mail

key = Config.SECRET_KEY_MAIL
algorithm = Config.ALGORITHM

mailBody = """
<html>
    <p>Tu as reçu ce mail car tu as effectué une demande de réinitialisation de ton mot de passe sur le portail des élèves des Mines !</p>
    <p>Ton identifiant est {1}. Clique <a href="https://eleves.rezal-mdm.com/reset/{0}">ici</a> pour réinitialiser ton mot de passe. Le lien expirera dans 15min.</p>
    <p>Si tu n'es pas à l'origine de cette demande, contact le VP Geek pour lui signaler.</p>
    
    <div>En cas de problème, contact moi à <a href="mailto:vianney.decroux@etu.minesparis.psl.eu">vianney.decroux@etu.minesparis.psl.eu</a></div>
    <div>Le VP Geek, 25decroux.</div>
</html>
"""

def has_permission(user: Utilisateur, perm: str):
    """
    Vérifie si un l'utilisateur a la permission perm
    """
    return Permission.query.filter_by(utilisateur=user, permission=perm).count() > 0

def get_permissions(page: int, per_page: int, pseudo: str, identite: str, email: str, promo: str, cycle: str, permission: str, est_baptise: str = ""):
    """
    Récupère tous les utilisateurs avec leurs permissions, avec pagination et filtres par colonne.
    """
    query = Utilisateur.query.order_by(Utilisateur.nom_utilisateur)
    
    if pseudo:
        query = query.filter(Utilisateur.nom_utilisateur.ilike(f"%{pseudo}%"))
    if identite:
        query = query.filter(
            or_(
                Utilisateur.prenom.ilike(f"%{identite}%"),
                Utilisateur.nom.ilike(f"%{identite}%")
            )
        )
    if email:
        query = query.filter(Utilisateur.email.ilike(f"%{email}%"))
    if promo:
        query = query.filter(Utilisateur.promotion.ilike(f"%{promo}%"))
    if cycle:
        query = query.filter(Utilisateur.cycle == cycle.lower())
    if est_baptise:
        if est_baptise.lower() == "true":
            query = query.filter(Utilisateur.est_baptise == True)
        elif est_baptise.lower() == "false":
            query = query.filter(Utilisateur.est_baptise == False)
    if permission:
        if permission == "avec":
            query = query.filter(Utilisateur.permissions.any())
        else:
            query = query.join(Utilisateur.permissions).filter(Permission.permission == permission)

    users = query.paginate(page=page, per_page=per_page)
    
    result = []
    for u in users:
        d = u.to_dict()
        d["est_baptise"] = u.est_baptise
        result.append(d)
        
    return {"permissions": result, "count": users.total}

def send_reset_mail(username: str):
    """
    Envoie le mail pour renouveler le mot de passe de l'utilisateur
    """
    user = Utilisateur.query.filter_by(nom_utilisateur=username).first()
    if not user:
        user = Utilisateur.query.filter_by(email=username).first()
    if not user:
        return False

    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": user.nom_utilisateur, "exp": expire} 
    encoded_jwt = jwt.encode(to_encode, key, algorithm=algorithm)

    text = mailBody.format(encoded_jwt, user.nom_utilisateur)
    send_mail("no-reply@rezal-mdm.com", user.email, "Réinitialisation de mot de passe", text)
    return True

def check_pw(user: Utilisateur, password:str):
    """
    Vérifie que c'est bien le mot de passe de l'utilisateur
    """
    hashed_password = user.mot_de_passe
    if hashed_password.startswith('pbkdf2_sha256$'):
        # It's an old Django hash.
        import hashlib
        import base64
        
        try:
            algo, iterations, salt, b64_hash = hashed_password.split('$', 3)
            iterations = int(iterations)
            
            # The password in old db is utf-8 encoded
            password_bytes = password.encode('utf-8')
            salt_bytes = salt.encode('utf-8')
            
            # Hash the provided password with the same salt and iterations
            derived_key = hashlib.pbkdf2_hmac('sha256', password_bytes, salt_bytes, iterations, dklen=32)
            
            # Compare with the stored hash
            # The stored hash is base64 encoded.
            stored_hash_bytes = base64.b64decode(b64_hash)
            
            if derived_key == stored_hash_bytes:
                # Password is correct. Let's upgrade the hash to Argon2.
                user.mot_de_passe = ph.hash(password)
                db.session.commit()
                return True
            else:
                return False
        except Exception:
            # In case of any error in parsing or decoding, fail closed.
            return False
            
    try:
        ph.verify(user.mot_de_passe, password)
        # If the password is correct and it was a legacy hash, rehash it.
        if ph.check_needs_rehash(user.mot_de_passe):
            user.mot_de_passe = ph.hash(password)
            db.session.commit()
        return True
    except (exceptions.VerifyMismatchError, exceptions.InvalidHash):
        return False

def set_new_password(token: str, password: str):
    """
    Change le mot de passe de l'utilisateur
    """
    try:
        payload = jwt.decode(token, key, algorithms=[algorithm])
    except jwt.ExpiredSignatureError:
        return False

    uid = payload.get("sub")
    user = Utilisateur.query.filter_by(nom_utilisateur=uid).first()
    if not user:
        return False
    user.mot_de_passe = ph.hash(password)
    db.session.commit()
    return True

def generate_reset_token(user: Utilisateur) -> str:
    """
    Génère un token JWT pour la réinitialisation du mot de passe
    """
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": user.nom_utilisateur, "exp": expire}
    return jwt.encode(to_encode, key, algorithm=algorithm)

def set_password_admin(user_id: int, password: str) -> bool:
    """
    Définit directement un mot de passe pour un utilisateur en tant qu'administrateur
    """
    user = Utilisateur.query.get(user_id)
    if not user:
        return False
    user.mot_de_passe = ph.hash(password)
    db.session.commit()
    return True

