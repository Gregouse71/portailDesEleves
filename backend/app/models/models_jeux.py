import random
from sqlalchemy.ext.mutable import MutableDict

from app import db


class JeuxPartie(db.Model):
    __tablename__ = 'jeux_partie'
    # ID de la partie
    id = db.Column(db.Integer, primary_key=True)

    jeu = db.Column(db.String(100), nullable=False)
    terminee = db.Column(db.Boolean, nullable=False, default=False)

    utilisateur = db.relationship('Utilisateur', back_populates='parties')
    utilisateur_id = db.Column(db.Integer, db.ForeignKey('utilisateurs_utilisateur.id'))

    score = db.Column(db.Integer, nullable=False, default=0)
    etat = db.Column(MutableDict.as_mutable(db.JSON))
    
    def __init__(self, utilisateur, jeu: str):
        if jeu not in ["2048"]:
            raise ValueError("Nom de jeu invalide")
        self.jeu = jeu
        self.terminee = False
        self.score = 0
        self.utilisateur = utilisateur
        if self.jeu == "2048":
            self.etat = {"plateau": [[0] * 4 for _ in range(4)]}
            self.add_random_tile()
            self.add_random_tile()

    def to_dict(self):
        return {
            "id": self.id,
            "jeu": self.jeu,
            "terminee": self.terminee,
            "score": self.score,
            "etat": self.etat
        }

    def add_random_tile(self):
        board = self.etat["plateau"]
        empty_cells = []
        for r in range(4):
            for c in range(4):
                if board[r][c] == 0:
                    empty_cells.append((r, c))
        
        if empty_cells:
            r, c = random.choice(empty_cells)
            board[r][c] = 2 if random.random() < 0.9 else 4
    
    def is_game_over(self):
        board = self.etat["plateau"]
        for r in range(4):
            for c in range(4):
                if board[r][c] == 0:
                    return False
                if c < 3 and board[r][c] == board[r][c+1]:
                    return False
                if r < 3 and board[r][c] == board[r+1][c]:
                    return False
        return True