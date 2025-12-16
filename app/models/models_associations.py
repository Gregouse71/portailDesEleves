from app import db
import os
import re
import shutil

from sqlalchemy import desc
from app.models.models_utilisateurs import Utilisateur

# Cette table sert à stocker les relations entre Association et Utilisateur


class Association(db.Model):
    __tablename__ = 'associations_association'
    # ID de l'association
    id = db.Column(db.Integer, primary_key=True)

    # Éléments ajoutés à la création de l'association — Modifiables par les membres de l'association
    nom = db.Column(db.String(1000), nullable=False)
    nom_dossier = db.Column(db.String(1000), nullable=False)
    description = db.Column(db.Text, nullable=True)
    logo_path = db.Column(db.String(1000), nullable=True)
    banniere_path = db.Column(db.String(1000), nullable=True)  # banniere de l'asso
    a_cacher_aux_nouveaux = db.Column(db.Boolean, nullable=False)

    # Les publications de l'asso
    publications = db.relationship('Publication', back_populates='association')
    # Mandats de l'asso
    mandats = db.relationship('AssociationMandat', back_populates='association')

    type_association = db.Column(db.String(1000), nullable=True)
    ordre_importance = db.Column(db.Integer, nullable=True)

    def __init__(
        self, nom: str, ordre_importance: int,description: str = None,
        type_association: str = None, logo_path: str = None,  banniere_path: str = None,
        a_cacher_aux_nouveaux: bool = False
    ):
        """
        Crée une nouvelle association
        """
        self.nom = nom
        self.description = description
        self.type_association = type_association
        self.logo_path = logo_path
        self.ordre_importance = ordre_importance
        self.banniere_path = banniere_path
        self.a_cacher_aux_nouveaux = a_cacher_aux_nouveaux

        # Créer un dossier pour l'association
        self.create_association_folder()

    def __repr__(self):
        """
        Methode optionnelle, mais utile pour deboguer et afficher l'association.
        """
        return f"<Association {self.nom}>"

    def update(self,
               nom: str = None,
               description: str = None):
        """
        Modifie les valeurs d'une association, puis met a jour la base de donnee.

        Les formats a respecter sont listes si apres. Cette doumentation fait autorite
        quant au format que doit avoir la class association

        /!\ Sauf exceptions la table association n'est pas vouee a etre modifiee a la main.
        Cette fonction sera utilisee au sein de fonctions bien precises.

        ----------------------
        - nom : str
            Nom de l'association, peut contenir des accents et des caracteres speciaux.
        - description : str
            Description de l'association, peut contenir des accents et des caracteres speciaux 
            ainsi que des sauts de ligne et des informations de mise en page HTML.
        - publications : liste d'objets Publication
            Liste des publications de l'association

        - type_association : str
            Type de l'association, doit etre un des types suivants :
            {'loi 1901','club BDE','club BDS','club BDA','autre'}
        - ordre_importance : int
            Ordre d'importance de l'association, doit etre un entier positif (vaut par défaut l'id de l'association)
        - a_cacher_aux_nouveaux : bool
            Est-ce que l'association doit être cachée aux non-baptisés.
        """

        if nom != None:
            self.nom = nom
        if description != None:
            self.description = description
    
    def to_dict(self):
        mandats_data = [
            {
                "membres" :[
                    {
                        "nom_utilisateur": f"{membre.utilisateur.prenom} {membre.utilisateur.nom}",
                        "id": membre.utilisateur.id,
                        "role": membre.role,
                        "position": membre.position,
                        "photo": membre.utilisateur.photo
                    }
                for membre in mandat.membres],
                "position": mandat.position,
                "nom": mandat.nom,
                "actuel": mandat.actuel,
                "id": mandat.id
            }
            for mandat in self.mandats
        ]
        
        return {
            "id": self.id,
            "nom_dossier": self.nom_dossier,
            "nom": self.nom,
            "img": self.logo_path,
            "ordre_importance": self.ordre_importance,
            "banniere_path": self.banniere_path,
            "description": self.description,
            "mandats": mandats_data
        }

    def create_association_folder(self):
        """
        Crée un dossier pour l'association
        """
        # nettoyer le nom de l'association en ne gardant que les caractères alphanumériques en minuscule
        nom_dossier = re.sub(r'\W+', '', self.nom).lower()
        self.nom_dossier = nom_dossier
        try:
            os.mkdir(f"upload/associations/{nom_dossier}")
        except:
            print(f"dossier {nom_dossier} déjà créé !")


class AssociationMandat(db.Model):
    __tablename__ = 'associations_mandat'
    id = db.Column(db.Integer, primary_key=True)

    nom = db.Column(db.String(1000), nullable=False)
    position = db.Column(db.Integer, nullable=False)
    actuel = db.Column(db.Boolean, nullable=False)

    # Association
    association_id = db.Column(db.Integer, db.ForeignKey('associations_association.id'))
    association = db.relationship('Association', back_populates='mandats')

    # Membres
    membres = db.relationship('AssociationMembre', back_populates='mandat')

    def __init__(self, asso: Association, nom: str, position: int = 0, actuel: bool = False):
        self.nom = nom
        self.association = asso
        self.position = position
        self.actuel = actuel


class AssociationMembre(db.Model):
    __tablename__ = 'associations_membre'
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), primary_key=True)
    mandat_id = db.Column(db.Integer, db.ForeignKey('associations_mandat.id'), primary_key=True)

    role = db.Column(db.String(1000), nullable=True)
    position = db.Column(db.Integer, nullable=True)

    utilisateur = db.relationship('Utilisateur', back_populates='associations')
    mandat = db.relationship('AssociationMandat', back_populates='membres')

    def __init__(self, utilisateur: Utilisateur, mandat: AssociationMandat, role: str="", position: int=0):
        self.utilisateur = utilisateur
        self.mandat = mandat
        self.role = role
        self.position = position

    def __repr__(self):
        return f"<AssociationMembre utilisateur_id={self.utilisateur_id} mandat_id={self.mandat_id}>"