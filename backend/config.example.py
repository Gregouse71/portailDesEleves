"""
Ce fichier contient la configuration de base de l'application, les paramètres de sécurité et 
les configurations de la base de données.

C'est ici qu'on précisera l'url de la base de donnée sur phpMyAdmin et les informations de 
connexion pour le deploiement. 

Pour le developpement, on commence par utiliser une bdd locale avec sqlite. Ce fichier est execute
par __init__.py lors de l'initialisation.
"""

import json

class Config:
    SECRET_KEY                  = 'une_cle_secrete_pour_developpement'  # générée avec `openssl rand -hex 32`
    SQLALCHEMY_DATABASE_URI     = 'sqlite:///app.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Permet de stocker les caractères UTF dans les objets JSON
    SQLALCHEMY_ENGINE_OPTIONS   = {"json_serializer": lambda obj: json.dumps(obj, ensure_ascii=False)}

    SESSION_COOKIE_SAMESITE='Lax'
    SESSION_COOKIE_SECURE=False

    ALGORITHM = "HS256"
    SECRET_KEY_MAIL             = "1234"  # générée avec `openssl rand -hex 32`

    RATELIMIT_STORAGE_URI       = "redis://localhost:6379/0"    # "memory://"
    RATELIMIT_STORAGE_OPTIONS   = {"socket_connect_timeout": 30}
    RATELIMIT_STRATEGY          = "moving-window"               # "fixed-window"

    AUTHLIB_INSECURE_TRANSPORT  = True                          # OAuth sans HTTPS, nécessaire pour le reverse proxy
    OAUTH2_TOKEN_EXPIRES_IN = { # 1 mois
        'authorization_code': 2592000,
        'implicit': 2592000,
        'password': 2592000,
        'client_credentials': 2592000,
        'refresh_token': 2592000,
    }
