"""
Script d'import ponctuel des livres depuis un fichier Excel vers la table
`bibliotheque_livres`, pour une association donnee.

Colonnes attendues dans le fichier Excel (première ligne = en-têtes) :
    Auteur | Edition | Série | Tome | Référence | Etat | Statut

- La colonne "Statut" n'est pas utilisée (elle est vide dans le fichier
  source) : tous les livres importés sont créés avec disponible=True.

Usage :
    python import_livres_excel.py chemin/vers/fichier.xlsx <asso_id>
    python import_livres_excel.py --vider <asso_id>
"""

import argparse

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


def vider_livres_asso(asso_id: int):
    """Supprime tous les livres (et leurs emprunts, via cascade ORM) d'une asso."""
    livres = Livre.query.filter_by(asso_id=asso_id).all()

    if not livres:
        print(f"Aucun livre trouvé pour l'asso {asso_id}.")
        return

    for livre in livres:
        db.session.delete(livre)  # declenche le cascade="all, delete-orphan" sur les emprunts

    db.session.commit()
    print(f"{len(livres)} livre(s) supprimé(s) pour l'asso {asso_id}.")


def importer_livres(fichier_excel: str, asso_id: int):
    df = pd.read_excel(fichier_excel, dtype=str)  # dtype=str evite les surprises de type
    df.columns = [str(c).strip() for c in df.columns]

    colonnes_attendues = {"Auteur", "Edition", "Série", "Tome", "Référence", "Etat", "Statut"}
    manquantes = colonnes_attendues - set(df.columns)
    if manquantes:
        print(f"ATTENTION colonnes manquantes dans le fichier : {manquantes}")

    crees = 0
    ignores = 0

    for i, row in df.iterrows():
        serie = clean(row.get("Série"))

        if not serie:
            print(f"[ligne {i + 2}] ignorée : 'Série' est vide (obligatoire).")
            ignores += 1
            continue

        livre = Livre(
            asso_id=asso_id,
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
    print(f"\nImport terminé : {crees} livre(s) créé(s), {ignores} ligne(s) ignorée(s), asso_id={asso_id}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import (ou vidage) de la bibliothèque d'une association.")
    parser.add_argument("fichier_excel", nargs="?", help="Chemin vers le fichier .xlsx à importer (absent si --vider)")
    parser.add_argument("asso_id", type=int, help="Id de l'association concernée")
    parser.add_argument("--vider", action="store_true", help="Vide la bibliothèque de l'asso, sans rien importer")
    args = parser.parse_args()

    if args.vider:
        if args.fichier_excel:
            print("--vider ignore l'argument fichier_excel : rien n'est importé.")
    elif not args.fichier_excel:
        parser.error("fichier_excel est requis sauf si --vider est utilisé.")

    _, app = create_app(Config)

    with app.app_context():
        if args.vider:
            vider_livres_asso(args.asso_id)
        else:
            importer_livres(args.fichier_excel, args.asso_id)