from app import create_app
from app import db
from app.models.models_OAth2 import OAuth2Client
import secrets
from config import Config

_, app = create_app(Config)
with app.app_context():
    
    # Generate secure random strings for MediaWiki
    client_id = secrets.token_urlsafe(24)
    client_secret = secrets.token_urlsafe(48)

    # 1. Create the client record WITHOUT client_metadata
    mediawiki_client = OAuth2Client(
        client_id=client_id,
        client_secret=client_secret,
        client_id_issued_at=0,
        client_secret_expires_at=0,
    )

    # 2. Use Authlib's setter method to apply the metadata
    mediawiki_client.set_client_metadata({
        "client_name": "WikiMines",
        "client_uri": "https://wiki.rezal-mdm.com/",
        "grant_types": ["authorization_code"],
        "redirect_uris": [
            "https://wiki.rezal-mdm.com/wiki/Special:PluggableAuthLogin"
        ],
        "response_types": ["code"],
        "scope": "openid profile email",
        "token_endpoint_auth_method": "client_secret_basic"
    })

    # 3. Save to the database
    db.session.add(mediawiki_client)
    db.session.commit()

    print(f"SAVE THESE! Client ID: {client_id}")
    print(f"SAVE THESE! Client Secret: {client_secret}")