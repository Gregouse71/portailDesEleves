# import_livres_excel.py
"""
Script d'import ponctuel des livres depuis un fichier Excel vers la table
`bibliotheque_livres`.

Colonnes attendues dans le fichier Excel (première ligne = en-têtes) :
    Auteur | Edition | Série | Tome | Référence | Etat | Statut

- La colonne "Statut" n'est pas utilisée (elle est vide dans le fichier
  source) : tous les livres importés sont créés avec disponible=True.

Usage :
    python import_livres_excel.py chemin/vers/fichier.xlsx
"""

import sys

import pandas as pd

from app import create_app, db
from app.models import Livre
from config import Config


def clean(value):
    """Convertit NaN / valeurs vides en None, sinon renvoie une string nettoyee."""
    if pd.isna(value):
        return None
    value = str(value).strip()
    return value if value else None


def main(fichier_excel: str):
    _, app = create_app(Config)

    df = pd.read_excel(fichier_excel, dtype=str)  # dtype=str evite les surprises de type
    df.columns = [str(c).strip() for c in df.columns]

    colonnes_attendues = {"Auteur", "Edition", "Série", "Tome", "Référence", "Etat", "Statut"}
    manquantes = colonnes_attendues - set(df.columns)
    if manquantes:
        print(f"ATTENTION colonnes manquantes dans le fichier : {manquantes}")

    with app.app_context():
        crees = 0
        ignores = 0

        for i, row in df.iterrows():
            serie = clean(row.get("Série"))

            if not serie:
                print(f"[ligne {i + 2}] ignorée : 'Série' est vide (obligatoire).")
                ignores += 1
                continue

            livre = Livre(
                serie=serie,
                auteur=clean(row.get("Auteur")),
                edition=clean(row.get("Edition")),
                tome=clean(row.get("Tome")),
                reference=clean(row.get("Référence")),
                etat=clean(row.get("Etat")),
            )
            # disponible=True est déjà défini par le constructeur de Livre

            db.session.add(livre)
            crees += 1

        db.session.commit()

        print(f"\nImport terminé : {crees} livre(s) créé(s), {ignores} ligne(s) ignorée(s).")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage : python import_livres_excel.py chemin/vers/fichier.xlsx")
        sys.exit(1)

    main(sys.argv[1])