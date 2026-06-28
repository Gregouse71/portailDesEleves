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


def get_embed_url(url: str):
    """
    Parse a video URL (YouTube, Vimeo, Dailymotion, PeerTube, etc.)
    and return its embed variant, or return the URL as-is if it's already an embeddable link.
    """
    import re
    from urllib.parse import urlparse
    url = url.strip()
    
    # 1. YouTube
    yt_pattern = r'(?:https?://)?(?:www\.|m\.)?(?:youtube\.com/(?:watch\?v=|embed/|shorts/|v/)|youtu\.be/)([a-zA-Z0-9_-]{11})'
    match = re.search(yt_pattern, url)
    if match:
        return f"https://www.youtube.com/embed/{match.group(1)}"
        
    # 2. Vimeo
    vimeo_pattern = r'(?:https?://)?(?:www\.)?(?:vimeo\.com/|player\.vimeo\.com/video/)([0-9]+)'
    match = re.search(vimeo_pattern, url)
    if match:
        return f"https://player.vimeo.com/video/{match.group(1)}"
        
    # 3. Dailymotion
    dm_pattern = r'(?:https?://)?(?:www\.)?(?:dailymotion\.com/(?:video|embed/video)/|dai\.ly/)([a-zA-Z0-9]+)'
    match = re.search(dm_pattern, url)
    if match:
        return f"https://www.dailymotion.com/embed/video/{match.group(1)}"

    # 4. PeerTube (paths /w/<id>, /videos/watch/<id>, or /videos/embed/<id>)
    pt_id_pattern = r'(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[a-zA-Z0-9_-]{22})'
    pt_pattern = r'/w/(' + pt_id_pattern + r')|/videos/watch/(' + pt_id_pattern + r')|/videos/embed/(' + pt_id_pattern + r')'
    
    parsed = urlparse(url)
    if parsed.netloc:
        match = re.search(pt_pattern, parsed.path)
        if match:
            video_id = next(g for g in match.groups() if g is not None)
            scheme = parsed.scheme if parsed.scheme else "https"
            return f"{scheme}://{parsed.netloc}/videos/embed/{video_id}"

    # Fallback: if it's already an absolute HTTP/HTTPS URL, return it as-is
    if url.startswith("http://") or url.startswith("https://"):
        return url
        
    return None