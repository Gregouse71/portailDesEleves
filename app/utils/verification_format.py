import dateutil
import re
import unicodedata
from datetime import datetime

def verifier_chaine_mail(chaine: str) -> bool:
    # Ceci n'est pas une bonne manière : une adresse mail peut être plus complexe
    return bool(re.fullmatch(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", chaine))

def valider_chaine_date_naissance(chaine: str) -> bool:
    try:
        dateutil.parser.parse(chaine)
        return True
    except:
        return False

def valider_chaine_texte(chaine: str) -> bool:
    """
    Accepte toutes les chaines de bases, hors emojis et caracteres d'autres langues
    """
    pattern = r'^[\w\s\u00C0-\u00FF\u20AC\u0021\u0022\u0023\u0024\u0025\u0026\u0027\u0028\u0029\u002A\u002B\u002C\u002D\u002E\u002F\u003A\u003B\u003C\u003D\u003E\u003F\u0040\u005B\u005D\u005E\u005F\u0060\u007B\u007C\u007D\u007E\u0021-\u007E]*$'

    return re.match(pattern, chaine)

def valider_questions_du_portail(dictionnaire: dict) -> bool:
    for cle, contenu in dictionnaire.items():
        if not valider_chaines_de_base(cle) or not valider_chaines_de_base(contenu):
            return False
    return True

def valider_instruments(instruments: list) -> bool:
    """
    Validates that instruments is a list of objects,
    where each object has a 'name' (string) and an optional 'niveau' (string).
    """
    if not isinstance(instruments, list):
        return False
    for item in instruments:
        if not isinstance(item, dict):
            return False
        if 'name' not in item or not isinstance(item['name'], str) or not valider_chaine_texte(item['name']):
            return False
        if 'niveau' in item and item['niveau'] is not None:
            if not isinstance(item['niveau'], str) or not valider_chaine_texte(item['niveau']):
                return False
    return True
