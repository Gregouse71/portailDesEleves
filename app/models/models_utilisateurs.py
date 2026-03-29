from app import db
from sqlalchemy.ext.mutable import MutableDict, MutableList
from flask_login import UserMixin # pour faire le lien entre la class utilisateur et flask_login
from datetime import date

# verification du format des donnees :
from app.utils.divers_utils import ph
from app.utils.verification_format import verifier_chaine_mail, valider_chaine_texte, valider_chaine_date_naissance
from ..utils.verification_format import valider_instruments
from ..utils.verification_format import valider_langues
from app.models.models_sondages import VoteSondage


import locale
locale.setlocale (locale.LC_ALL, 'fr_FR.UTF-8')


default_questions = { # Les trois premiers caractères servent à l'odonnancement
    "010Ta devise ?": "",
    "020Tes hobbies ?": "",
    "030Quelles assoces comptes-tu faire ?": "",
    "040Tes sports ?": "",
    "050Raconte une blague :": "",
    "060Trash ton co :": "",
    "070Et ton parrain, comment tu l'aimes ?": "",
    "080Et ton fillot ?": "",
    "090Champagne ou Ricard ?": "",
    "100Ton top 5 du moment :": "",
    "110Que signifie JPG ?": "",
    "120Qui convoites-tu secrètement ?": "",
    "130Le truc le plus absurde qui te soit jamais arrivé :": "",
    "140Tes vacances de rêve ?": "",
    "150Ton date idéal ?": "",
    "160Ton talent caché ?": "",
}


cos_association = db.Table('utilisateurs_cos',
    db.Column('user_id', db.Integer, db.ForeignKey('utilisateurs_utilisateur.id')),
    db.Column('co_id', db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'))
)

parrainage_association = db.Table('utilisateurs_marrains',
    db.Column('marrain_id', db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), primary_key=True),
    db.Column('fillot_id', db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), primary_key=True)
)

class Utilisateur(db.Model, UserMixin) :
    __tablename__ = 'utilisateurs_utilisateur'
    # Initialise lors de l'ajout d'une promotion. Ne dois pas etre modifiable par l'utilisateur
    id = db.Column(db.Integer, primary_key=True)  # Clef primaire
    nom_utilisateur = db.Column(db.String(100), nullable=False, unique=True)
    prenom = db.Column(db.String(1000), nullable=False)
    nom = db.Column(db.String(1000), nullable=False)
    promotion = db.Column(db.String(4), nullable=True)
    cycle = db.Column(db.String(10), nullable=False) # Parmi 'ic', 'ast', 'vs', 'ev', 'isup', 'de'
    est_visible = db.Column(db.Boolean, nullable=False, default=True)
    est_superutilisateur = db.Column(db.Boolean, nullable=False, default=False)

    # Modifiable avec un formulaire prevu a cet effet
    mot_de_passe = db.Column(db.String(255), nullable=False)

    # Modifiable par l'utilisateur
    photo = db.Column(db.String(1000), nullable=True) # le nom du fichier
    email = db.Column(db.String(1000), nullable=False)
    date_de_naissance = db.Column(db.Date(), nullable=True)
    surnom = db.Column(db.String(1000), nullable=True)
    pronoms = db.Column(db.String(1000), nullable=True)
    ville_origine = db.Column(db.String(1000), nullable=True)
    telephone = db.Column(db.String(100), nullable=True)
    chambre = db.Column(db.String(1000), nullable=True)
    sports = db.Column(db.String(1000), nullable=True)
    instruments = db.Column(MutableList.as_mutable(db.JSON), nullable=True)
    langues = db.Column(MutableList.as_mutable(db.JSON), nullable=True)

    # Gestion du parrainnage :
    marrains = db.relationship(
        'Utilisateur',
        secondary=parrainage_association,
        primaryjoin=(parrainage_association.c.fillot_id == id),
        secondaryjoin=(parrainage_association.c.marrain_id == id),
        back_populates='fillots'
    )

    fillots = db.relationship(
        'Utilisateur',
        secondary=parrainage_association,
        primaryjoin=(parrainage_association.c.marrain_id == id),
        secondaryjoin=(parrainage_association.c.fillot_id == id),
        back_populates='marrains'
    )
    est_baptise = db.Column(db.Boolean, nullable=False, default=False)

    # Gestion des colocations
    cos = db.relationship('Utilisateur',
                          secondary=cos_association,
                          primaryjoin=(cos_association.c.user_id == id),
                          secondaryjoin=(cos_association.c.co_id == id),
                          backref=db.backref('co_of', lazy='dynamic'),
                          lazy='dynamic')

    # Questions du portail - modifiable avec un formulaire
    questions_reponses_du_portail = db.Column(MutableDict.as_mutable(db.JSON), nullable=True)
    # Exemple = { "trash to co" : "Il pue", "Quelles assos comptes-tu faire ?" : "Le WEIIIII" }

    # Liste des assos actuelles
    associations = db.relationship('AssociationMembre', back_populates='utilisateur')
    
    # Parties pour les jeux
    parties = db.relationship('JeuxPartie', back_populates='utilisateur')
    # Permissions
    permissions = db.relationship('Permission', back_populates='utilisateur')
    # Operations soifguard
    operations = db.relationship('OperationSoifguard', back_populates='utilisateur', foreign_keys='OperationSoifguard.utilisateur_id')
    credits_asso = db.relationship('OperationSoifguard', back_populates='auteur', foreign_keys='OperationSoifguard.auteur_id')

    # Sondages
    vote_sondaj_du_jour = db.Column(db.Integer, nullable=True)
    nombre_votes = db.Column(db.Integer, default=0)
    score_recent = db.Column(db.Float, nullable=False, default=0)
    score_global_con = db.Column(db.Float, nullable=False, default=0)
    score_global_div = db.Column(db.Float, nullable=False, default=0)
    votes = db.relationship('VoteSondage', back_populates='utilisateur')
    # Messages
    messages = db.relationship('Message', back_populates='utilisateur')

    # 2048
    # Apparaitra sur la page du 2048
    meilleur_score_2048 = db.Column(db.Integer, nullable=False)

    # soifguard
    solde_octo = db.Column(db.Numeric(10, 2), nullable=False, default=0)  # Arrondi à 2 décimales
    solde_biero = db.Column(db.Numeric(10, 2), nullable=True, default=0)  # Arrondi à 2 décimales
    est_cotisant_biero = db.Column(db.Integer, nullable=False, default=False)
    est_cotisant_octo = db.Column(db.Integer, nullable=False, default=False)

    # Publications
    publications = db.relationship('Publication', back_populates='auteur')
    # Commentaires
    commentaires = db.relationship('Commentaire', back_populates='auteur')

    def __init__(self, nom_utilisateur:str, prenom:str, nom:str, promotion:int, email:str, cycle:str, mot_de_passe_en_clair:str, date_de_naissance:date= None) :
        """
        Cree un nouvel utilisateur
        cycle doit etre "ic", "ast", "isup", "vs", "ev" ou "de" # pour matmaz
        """
        if valider_chaine_texte(nom_utilisateur) :
            self.nom_utilisateur = nom_utilisateur
        else :
            raise ValueError(f"Nom d'utilisateur invalide : {nom_utilisateur}")
        if valider_chaine_texte(prenom) : 
            self.prenom = prenom
        else :
            raise ValueError(f"Prenom invalide : {prenom}")
        if valider_chaine_texte(nom) :
            self.nom = nom
        else :
            raise ValueError(f"Nom de famille invalide : {nom}")
        self.promotion = promotion
        if cycle in {'ic', 'ast', 'vs', 'isup', 'ev', 'de'} :
            self.cycle = cycle 
        else :
            raise ValueError("Cycle invalide. doit etre dans {'ic', 'ast', 'vs', 'isup', 'ev', 'de'}")
        self.est_visible = True
        self.est_superutilisateur = False
        self.est_baptise = False
        if verifier_chaine_mail(email):
            self.email = email
        else :
            raise ValueError("Mail invalide")
        self.mot_de_passe = ph.hash(mot_de_passe_en_clair)
        self.nombre_participations_sondaj = 0 
        self.nombre_victoires_sondaj = 0
        self.meilleur_score_2048 = 0

        self.questions_reponses_du_portail = default_questions
        self.date_de_naissance = date_de_naissance
    
    def __repr__(self):
        """
        Methode optionnelle, mais utile pour deboguer et afficher l'utilisateur.
        """
        return f"<Utilisateur {self.nom_utilisateur}>"
    
    def update(self, data) :
        """
        data : dictionnaire avec les clés suivantes :
        - surnom : str
            Contient les tirets, espaces, apostrophes, et accents. Majuscules ou minuscules. Autres caracteres interdits.
        - email : str
            Le mail au format des Mines. Cette verification n'est pas effctuee, un autre fonction existera pour generer le mail
            avec nom + prenom
        - date_de_naissance: datetime
        - ville_origine : str
            Peut contenir tirets, espaces, apostrophes, et accents. Premiere lettre de chaque nom en majscule.
        - telephone : str
            Au format "0612345678" ou "0033612345678" ou "+33612345678". En cas d'extension telephonique, ne verifie pas la validite
        - chambre : str
        - instruments : str
            Du texte, avec accents et caracteres speciaux autorises mais pas emojis. 
        - langues : str
            Du texte, avec accents et caracteres speciaux autorises mais pas emojis. 
        - publications : liste d'objets Publication
            Liste des publications d'utilisateur
        """
        for key in data:
            value = data[key]
            if key == "email" :
                if value is None or verifier_chaine_mail(value) :
                    self.email = value
                else :
                    raise ValueError(f"Non modifie. Le mail '{value}' est invalide.")
            elif key=="date_de_naissance" :
                if value is None or valider_chaine_date_naissance(value) :
                    self.date_de_naissance = value
                else :
                    raise ValueError(f"Non modifie. date_de_naissance doit etre au format 'AAAAMMJJ'. Date donnee : {value}")
            elif key=="surnom" :
                if value is None or valider_chaine_texte(value) :
                    self.surnom = value
                else :
                    raise ValueError(f"Non modifie. Le surnom '{value}' est invalide.")
            elif key=="pronoms" :
                if value is None or valider_chaine_texte(value) :
                    self.pronoms = value
                else :
                    raise ValueError(f"Non modifie. Le surnom '{value}' est invalide.")
            elif key=="ville_origine" :
                if value is None or valider_chaine_texte(value) :
                    self.ville_origine = value
                else :
                    raise ValueError(f"Non modifie. La ville '{value}' est invalide.")
            elif key=="telephone" :
                if value is None or valider_chaine_texte(value) :
                    self.telephone = value
                else :
                    raise ValueError(f"Non modifie. Le format du numero '{value}' n'est pas reconnu.")
            elif key=="chambre" :
                if value is None or valider_chaine_texte(value) :
                    self.chambre = value
                else :
                    raise ValueError(f"Non modifie. Caracteres interdits dans '{value}'.")
            elif key=="sports" :
                if value is None or valider_chaine_texte(value) :
                    self.sports = value
                else :
                    raise ValueError(f"Non modifie. Caracteres interdits dans '{value}'.")
            elif key=="instruments" :
                if value is None or valider_instruments(value) :
                    self.instruments = value
                else :
                    raise ValueError(f"Non modifie. Caracteres interdits dans '{value}'.")
            elif key=="langues" :
                if value is None or valider_langues(value):
                    self.langues = value
                else :
                    raise ValueError(f"Non modifie. Caracteres interdits dans '{value}'.")


    def to_dict(self, victoires=False, defaites=False):
        return {
            "id": self.id,
            "nom_utilisateur": self.nom_utilisateur,
            "prenom": self.prenom,
            "nom": self.nom,
            "surnom": self.surnom,
            "pronoms": self.pronoms,
            "promotion": self.promotion,
            "chambre": self.chambre,
            "cycle": self.cycle,
            "photo": self.photo,
            "email": self.email,
            "telephone": self.telephone,
            "date_de_naissance": self.date_de_naissance.isoformat() if self.date_de_naissance is not None else None,
            "ville_origine": self.ville_origine,
            "sports": self.sports,
            "instruments": self.instruments if self.instruments is not None else [],
            "langues": self.langues if self.langues is not None else [],
            "marrains": [{"id": marrain.id, "nom_utilisateur": f"{marrain.prenom} {marrain.nom}"} for marrain in self.marrains],
            "cos": [{"id": co.id, "nom_utilisateur": f"{co.prenom} {co.nom}"} for co in self.cos],
            "fillots": [{"id": fillot.id, "nom_utilisateur": f"{fillot.prenom} {fillot.nom}"} for fillot in self.fillots],
            "vote_sondaj_du_jour": self.vote_sondaj_du_jour,
            "is_superuser": self.est_superutilisateur,
            "score_recent": self.score_recent,
            "score_global_con": self.score_global_con,
            "score_global_div": self.score_global_div,
            "nombre_votes": self.nombre_votes,
            "solde_octo": self.solde_octo,
            "solde_biero": self.solde_biero,
            "meilleur_score_2048": self.meilleur_score_2048,
            "est_cotisant_biero": self.est_cotisant_biero,
            "est_cotisant_octo": self.est_cotisant_octo,
            "victoires": VoteSondage.query.filter_by(utilisateur_id=self.id, gagnant=True).count() if victoires else None,
            "defaites": VoteSondage.query.filter_by(utilisateur_id=self.id, perdant=True).count() if defaites else None,
        }