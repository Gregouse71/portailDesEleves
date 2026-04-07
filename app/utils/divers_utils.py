from argon2 import PasswordHasher
import smtplib
from email.message import EmailMessage
from email.mime.text import MIMEText

ph = PasswordHasher()


def send_mail(From: str, To: str, Subject: str, Text: str, attachement = None):
    """
    Envoie, de la part de *To*, un mail à *To*, avec pour contenu le text *Text*,
    en html
    """
    message = EmailMessage()
    message['Subject'] = Subject
    message['From'] = From
    message['To'] = To

    message.set_content(Text, subtype='html')

    if attachement:
        message.add_attachment(attachement[0], maintype=attachement[1], subtype=attachement[2], filename=attachement[3])

    with smtplib.SMTP('localhost') as s:
        s.send_message(message)