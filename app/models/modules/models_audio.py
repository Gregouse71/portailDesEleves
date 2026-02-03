from app import db

class AssoAlbum(db.Model):
    __tablename__ = 'associations_album'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)
    
    association_id = db.Column(db.Integer, db.ForeignKey('associations_association.id'), nullable=False)
    association = db.relationship('Association', backref=db.backref('audio_albums', lazy='dynamic'))
    
    audios = db.relationship('AssoAudio', back_populates='album', cascade="all, delete-orphan")

    def __init__(self, name, association_id, position=0):
        self.name = name
        self.association_id = association_id
        self.position = position

class AssoAudio(db.Model):
    __tablename__ = 'associations_audio'
    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(1000), nullable=False)
    position = db.Column(db.Integer, nullable=False, default=0)

    association_id = db.Column(db.Integer, db.ForeignKey('associations_association.id'), nullable=False)
    album_id = db.Column(db.Integer, db.ForeignKey('associations_album.id'), nullable=False)
    
    album = db.relationship('AssoAlbum', back_populates='audios')

    def __init__(self, nom, file_path, association_id, album_id, position=0):
        self.nom = nom
        self.file_path = file_path
        self.position = position
        self.association_id = association_id
        self.album_id = album_id

    def __repr__(self):
        return f'<AssoAudio {self.nom}>'