import os
import random
import unicodedata
from datetime import date

from app import create_app, db
from app.models import (
    Association,
    AssoAudio,
    AssoAlbum,
    Utilisateur
)
from config import Config

# --- Configuration ---
# Créer l'application Flask
_, app = create_app(Config)

# --- Main script ---
with app.app_context():
    print("Initialisation de l'environnement de développement...")

    # 1. Réinitialiser la base de données
    print("Réinitialisation de la base de données...")
    db.create_all()
    print("Base de données réinitialisée.")

    # 2. Créer les associations
    print("Création des associations...")
    bde = Association(nom="BDE", description="Bureau des élèves", type_association="loi 1901", ordre_importance=1, modules=['Info', 'Membres', 'Events', 'Posts', 'Media', 'Elections'])
    bds = Association(nom="BDS", description="Bureau des sports", type_association="loi 1901", ordre_importance=2, modules=['Info', 'Membres', 'Events', 'Posts', 'Media'])
    # On ajoute le module 'Audio' au BDA
    bda = Association(nom="BDA", description="Bureau des arts", type_association="loi 1901", ordre_importance=3, modules=['Info', 'Membres', 'Events', 'Posts', 'Audio', 'Media'])
    
    db.session.add_all([bde, bds, bda])
    db.session.commit()
    print("Associations créées.")

    # 3. Créer les utilisateurs de base
    print("Création des utilisateurs de test...")
    utilisateurs_specifiques = [
        ("23imbert", "Jules", "Imbert", 23, "jules@mail.com", "ic", "1234"),
        ("23fruchard", "Achille", "Fruchard", 23, "achille@mail.com", "ic", "1234"),
        ("23deferran", "Louise", "De Ferran", 24, "louise@mail.com", "ic", "1234"),
    ]

    for u_data in utilisateurs_specifiques:
        nouvel_utilisateur = Utilisateur(
            nom_utilisateur=u_data[0],
            prenom=u_data[1],
            nom=u_data[2],
            promotion=u_data[3],
            email=u_data[4],
            cycle=u_data[5],
            mot_de_passe_en_clair=u_data[6]
        )
        db.session.add(nouvel_utilisateur)

    # Ajouter un super utilisateur
    super_user = Utilisateur("admin", "Admin", "Dev", 23, "admin@mail.com", "ic", "1234")
    super_user.est_superutilisateur = True
    super_user.est_baptise = True
    db.session.add(super_user)
    db.session.commit()
    print("Utilisateurs de test créés.")

    # 4. Créer des utilisateurs aléatoires
    print("Création de 100 utilisateurs aléatoires...")
    prenoms = ["Lucas", "Clara", "Maxime", "Charlotte", "Thomas", "Pauline", "Mathis", "Élise", "Gabriel", "Marie", "Arthur", "Sofia", "Henri", "Audrey", "Lucie", "Victor", "Camille", "Jean", "Alice", "Martin", "Hugo", "Bérénice", "Florian", "Iris", "Jérôme", "Olivier", "Lucie", "Léon", "Émilie", "Marc", "Isabelle", "Paul", "Nathalie", "Xavier", "Elise", "Morgan", "Gabrielle", "Simon", "Carla", "Julien", "Emma", "Quentin", "Laura", "Thibault", "Viviane", "Adrien", "Nathan", "Sophie", "Éric", "Amandine", "Romain", "Mélanie", "Yohan", "Noémie", "Alexandre", "Justine", "Antoine", "Sarah", "David", "Manon", "Benoît", "Johanna", "François", "Océane", "Guillaume", "Coralie", "Stéphane", "Élodie", "Cédric", "Morgane", "Arnaud", "Julie", "Gaspard", "Anaïs", "Louis", "Margaux", "Jules", "Victoria", "Damien", "Florence", "Michel", "Claire", "Pascal", "Marion", "Valentin", "Chloé", "Jean-Baptiste", "Cécile", "Kevin", "Laetitia"]
    noms = ["Dupont", "Martin", "Bernard", "Lemoine", "Leclerc", "Robert", "Moreau", "Fournier", "Durand", "Blanc", "Rousseau", "Hernandez", "Roy", "Gauthier", "Jacques", "Caron", "Deschamps", "Boucher", "Charpentier", "Pires", "Delmas", "Laurent", "Houdin", "Mercier", "Dupuis", "Vallée", "Coulon", "Petit", "Renard", "Dufresne", "Roger", "Chauvin", "Benoit", "David", "Thomas", "Monnier", "Faure", "Morel", "Raymond", "Chapelain", "Bonnet", "Gérard", "Chevalier", "Lucas", "Renaud", "Marchand", "Colin", "Guillot", "Perrot", "Lejeune", "Bertin", "Baron", "Leduc", "Loiseau", "Texier", "Vaillant", "Millet", "Payet", "Delaunay", "Briand", "Pichon", "Delorme", "Gros", "Albert", "Mallet", "Weber", "Joubert", "Noël", "Descamps", "Lefort", "Maillard", "Maheu", "Peltier", "Verdier", "Bazin", "Laporte", "Turpin", "Poirier", "Legendre", "Paris", "Navarro", "Leconte", "Dumont", "Bouvet", "Charrier", "Cordier", "Blanchard", "Boucher", "Guichard", "Besson"]
    random.shuffle(noms)
    cycles = ["ic"] * 50 + ["isup"] * 15 + ["ev"] * 10 + ["vs"] * 10 + ["ast"] * 15
    promotions = [20, 21, 22, 23, 24]
    utilisateurs_aleatoires = [(random.choice(prenoms), nom, random.choice(promotions), random.choice(cycles)) for nom in noms]

    for i, (prenom, nom, promotion, cycle) in enumerate(utilisateurs_aleatoires):
        nom_utilisateur = f"{promotion}{unicodedata.normalize('NFKD', nom).encode('ascii', 'ignore').decode().lower()}"
        email = f"{nom_utilisateur}@example.com"
        if not Utilisateur.query.filter_by(nom_utilisateur=nom_utilisateur).first():
            utilisateur = Utilisateur(
                nom_utilisateur=nom_utilisateur, prenom=prenom, nom=nom, promotion=promotion, email=email, cycle=cycle,
                mot_de_passe_en_clair="1234",
                date_de_naissance=date(year=2000 + promotion - 20, month=(i % 12) + 1, day=(i % 28) + 1)
            )
            db.session.add(utilisateur)
    db.session.commit()
    print(f"{len(utilisateurs_aleatoires)} utilisateurs aléatoires créés.")

    # 5. Créer des données audio pour le BDA
    print("Création des données audio pour le BDA...")
    bda_asso = Association.query.filter_by(nom="BDA").one()

    media_dir = os.path.join(Config.UPLOAD_BASE_FOLDER, 'associations', bda_asso.nom_dossier, 'media')
    os.makedirs(media_dir, exist_ok=True)

    # Create Albums
    album1 = AssoAlbum(name='Chants de promo', association_id=bda_asso.id, position=0)
    album2 = AssoAlbum(name='Soirée', association_id=bda_asso.id, position=1)
    db.session.add_all([album1, album2])
    db.session.commit()

    # Create Songs
    audios_data = [
        {'nom': 'Hymne du BDA', 'album_id': album1.id, 'filename': 'hymne_bda.mp3'},
        {'nom': 'Le p\'tit bonhomme en mousse', 'album_id': album2.id, 'filename': 'mousse.mp3'}
    ]

    for audio_info in audios_data:
        # Create dummy file
        dummy_filepath = os.path.join(media_dir, audio_info['filename'])
        with open(dummy_filepath, 'w') as f:
            f.write("dummy audio content")
            
        # Create DB record
        audio_record = AssoAudio(
            nom=audio_info['nom'],
            album_id=audio_info['album_id'],
            file_path=audio_info['filename'],
            association_id=bda_asso.id
        )
        db.session.add(audio_record)
        
    db.session.commit()
    print("Données audio créées.")

    print("Environnement de développement initialisé avec succès !")
