import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta, timezone
from config import Config
import jwt
from argon2 import exceptions

from app.utils.divers_utils import ph
from app.models.models_utilisateurs import Utilisateur

key = Config.SECRET_KEY_MAIL
algorithm = Config.ALGORITHM

mailBody = """
<html>
    <p>Tu as reçu ce mail car tu as effectué une demande de réinitialisation de ton mot de passe sur le portail des élèves des Mines !</p>
    <p>Ton identifiant est {1}. Clique <a href="https://eleves.rezal-mdm.com/reset/{0}">ici</a> pour réinitialiser ton mot de passe. Le lien expirera dans 15min.</p>
    <p>Si tu n'es pas à l'origine de cette demande, contact le VP Geek pour lui signaler.</p>
    
    <div>En cas de problème, contact moi à <a href="mailto:webmaster-bde@mines-paristech.fr">webmaster-bde@mines-paristech.fr</a></div>
    <div>Le VP Geek BDE, Adria</div>
</html>
"""

def send_reset_mail(username: str):
    """
    Envoie le mail pour renouveler le mot de passe de l'utilisateur
    """
    user = Utilisateur.query.filter_by(nom_utilisateur=username).first()
    if not user:
        return False

    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"sub": username, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, key, algorithm=algorithm)

    msg = MIMEText (mailBody.format (encoded_jwt, user.username), 'html')
    msg['Subject'] = "Réinitialisation de mot de passe"
    msg['From'] = "no-reply@eleves.mines-paris.eu"
    msg['To'] = user.email

    s = smtplib.SMTP('localhost')
    s.sendmail("no-reply@eleves.mines-paris.eu", user.email, msg.as_string())
    s.quit()
    return True

def check_pw(user: Utilisateur, password:str):
    """
    Vérifie que c'est bien le mot de passe de l'utilisateur
    """
    try:
        ph.verify(user.mot_de_passe, password)
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
    user.mot_de_passe = ph.hash(password)
    return True
