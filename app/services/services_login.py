import smtplib
from email.message import EmailMessage

from app.models.models_utilisateurs import Utilisateur

mailFile = "mail.html"

def send_reset_mail(username: str):
    user = Utilisateur.query.filter_by(nom_utilisateur=username).first()
    if not user:
        return False

    msg = EmailMessage()
    with open(mailFile) as f:
        msg.set_content(f.read())

    msg["Subject"] = "Réinitialisation de mot de passe"
    msg["From"] = "no-reply@eleves.mines-paris.eu"
    msg["To"] = user.email
    
    print("Sent mail")
    
    s = smtplib.SMTP('localhost')
    s.send_message(msg)
    s.quit()
    return True