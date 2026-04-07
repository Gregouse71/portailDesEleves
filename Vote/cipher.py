from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
import base64
import pandas as pd

#                    Récupération de la clé                   #
###############################################################
with open("key.pem", "rb") as key_file:
    private_key = serialization.load_pem_private_key(
        key_file.read(),
        password=None,
    )

#      Vérification de tous les votes pour trouver le bon     #
###############################################################
df = pd.read_csv("votes.csv", sep=',', comment="#", index_col=0)
for i, cle in df.iterrows():
    try:
        plaintext = private_key.decrypt(
            base64.b64decode(cle['Clé']),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        print(f"Nom d'utilisateur : {plaintext.decode('utf-8')}. Vote : {cle["Vote"]}")
    except ValueError:
        pass
