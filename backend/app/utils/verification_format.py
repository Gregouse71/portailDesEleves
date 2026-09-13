import dateutil
import re

def verifier_chaine_mail(chaine: str) -> bool:
    # Ceci n'est pas une bonne manière : une adresse mail peut être plus complexe
    return bool(re.fullmatch(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}$", chaine))

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
    pattern = r'^[\w\s\u00C0-\u00FF\u0152\u0153\u2018\u2019\u201C\u201D\u00AB\u00BB\u2013\u2014\u2026\u00A0\u20AC\u0021-\u007E]*$'

    return re.match(pattern, chaine)

def valider_questions_du_portail(dictionnaire: dict) -> bool:
    pattern = re.compile(
        r'[^\w\s\u00C0-\u00FF\u0152\u0153\u2018\u2019\u201C\u201D'
        r'\u00AB\u00BB\u2013\u2014\u2026\u00A0\u20AC\u0021-\u007E]'
    )

    for cle, contenu in dictionnaire.items():
        if not isinstance(cle, str) or not isinstance(contenu, str):
            return False
        dictionnaire[cle] = pattern.sub('', contenu)

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

def valider_langues(langues: list) -> bool:
    """
    Validates that langues is a list of objects,
    where each object has a 'name' (string) and an optional 'niveau' (string).
    """
    if not isinstance(langues, list):
        return False
    for item in langues:
        if not isinstance(item, dict):
            return False
        if 'name' not in item or not isinstance(item['name'], str) or not valider_chaine_texte(item['name']):
            return False
        if 'niveau' in item and item['niveau'] is not None:
            if not isinstance(item['niveau'], str) or not valider_chaine_texte(item['niveau']):
                return False
    return True
