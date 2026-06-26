from app import db
from datetime import datetime, timezone
from sqlalchemy.ext.mutable import MutableList


class EchecsElo(db.Model):
    """
    Classement ELO d'un joueur aux échecs.
    Créé à la première partie avec un rating de 1500.
    """
    __tablename__ = 'echecs_elo'

    id             = db.Column(db.Integer, primary_key=True)
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=False, unique=True)
    rating         = db.Column(db.Integer, nullable=False, default=1500)
    nb_parties     = db.Column(db.Integer, nullable=False, default=0)  # pour le facteur K
    victoires      = db.Column(db.Integer, nullable=False, default=0)
    defaites       = db.Column(db.Integer, nullable=False, default=0)
    nulles         = db.Column(db.Integer, nullable=False, default=0)
    mis_a_jour_le  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    derniere_partie = db.Column(db.DateTime, nullable=True)
    parties_retour = db.Column(db.Integer, default=0)               # Nombre de parties jouées depuis le retour d'inactivité
    rd         = db.Column(db.Float, nullable=False, default=350.0)   # Rating Deviation (incertitude)
    volatilite = db.Column(db.Float, nullable=False, default=0.06)    # Volatilité

    utilisateur = db.relationship('Utilisateur', backref=db.backref('elo_echecs', uselist=False))

    def to_dict(self):
        return {
            'utilisateur_id':  self.utilisateur_id,
            'nom_utilisateur': self.utilisateur.nom_utilisateur,
            'prenom':          self.utilisateur.prenom,
            'nom':             self.utilisateur.nom,
            'rating':          self.rating,
            'rd':              self.rd,
            'volatilite':      self.volatilite,
            'nb_parties':      self.nb_parties,
            'victoires':       self.victoires,
            'defaites':        self.defaites,
            'nulles':          self.nulles,
        }


class EchecsDefi(db.Model):
    """
    Défi en attente d'être accepté.
    to_user = NULL  → défi ouvert à tous
    to_user = id    → défi ciblé
    mode = 'humain' → multijoueur
    mode = 'ia'     → contre Stockfish (partie créée immédiatement)
    """
    __tablename__ = 'echecs_defi'

    id            = db.Column(db.Integer, primary_key=True)
    createur_id   = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=False)
    adversaire_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=True)
    mode          = db.Column(db.String(10),  default='humain')    # 'humain' | 'ia'
    niveau_ia     = db.Column(db.Integer,     default=5)           # 1 → 20
    statut        = db.Column(db.String(20),  default='en_attente')# en_attente | accepte | annule
    cree_le       = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc))

    createur   = db.relationship('Utilisateur', foreign_keys=[createur_id],   backref='defis_envoyes')
    adversaire = db.relationship('Utilisateur', foreign_keys=[adversaire_id], backref='defis_recus')
    partie     = db.relationship('EchecsPartie', back_populates='defi', uselist=False)


class EchecsPartie(db.Model):
    """
    Partie d'échecs en cours ou terminée.
    noir_id = NULL en mode IA (Stockfish joue les noirs).
    """
    __tablename__ = 'echecs_partie'

    id         = db.Column(db.Integer, primary_key=True)
    defi_id    = db.Column(db.Integer, db.ForeignKey('echecs_defi.id'), nullable=False)
    mode       = db.Column(db.String(10), default='humain')  # 'humain' | 'ia'
    niveau_ia  = db.Column(db.Integer,   default=5)

    blanc_id   = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=True)
    noir_id    = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=True)

    fen        = db.Column(db.String(100), nullable=False,
                           default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')

    statut     = db.Column(db.String(20), default='en_cours')
    # en_cours | echec | mat | pat

    gagnant    = db.Column(db.String(10), nullable=True)    # 'blanc' | 'noir' | NULL
    dernier_coup = db.Column(db.String(10), nullable=True)  # format UCI ex: "e2e4"
    historique_coups = db.Column(MutableList.as_mutable(db.JSON), nullable=True, default=list)
    elo_calcule  = db.Column(db.Boolean, default=False)     # évite de recalculer 2 fois
    elo_variation = db.Column(db.JSON, nullable=True)

    cree_le = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    modifie_le = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    defi  = db.relationship('EchecsDefi', back_populates='partie')
    blanc = db.relationship('Utilisateur', foreign_keys=[blanc_id], backref='parties_blanc')
    noir  = db.relationship('Utilisateur', foreign_keys=[noir_id],  backref='parties_noir')
    nulle_proposee_par = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'), nullable=True)

    def to_dict(self):
        return {
            'id':           self.id,
            'mode':         self.mode,
            'fen':          self.fen,
            'statut':       self.statut,
            'gagnant':      self.gagnant,
            'dernier_coup': self.dernier_coup,
            'blanc_id':     self.blanc_id,
            'noir_id':      self.noir_id,
            'blanc_pseudo': self.blanc.nom_utilisateur if self.blanc else 'Stockfish',
            'noir_pseudo':  self.noir.nom_utilisateur  if self.noir  else 'Stockfish',
            'nulle_proposee_par': self.nulle_proposee_par,
        }