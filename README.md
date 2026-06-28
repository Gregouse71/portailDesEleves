# Documentation du nouveau portail des Élèves


## I. Contexte général

Ce portail est une modernisation du portail des élèves commencé en 2007 (?), amélioré en 2013 (?), puis par le VP Geek en 2017. Son principal problème est de n'être accessible, à ma connaissance, que depuis la machine sur laquelle il est hébergé. Il n'y avait donc pas de développement à plusieurs possibles, et s'il y avait bien un suivi git au départ, ça fait longtemps qu'il a été abandonnée (plus de 3500 fichiers modifiés ou non suivis). Il a vocation a être modifié, amélioré au fil du temps, et le repertoire git est un outil essentiel pour assurer cela, avec l'aide du déploiement automatisé permis par gitlab.

Le but est d'écrire du code propre. Pour ce faire, inspirez vous de ce qui a été fait pour les événements et les élections, qui constituent un bon exemple avec api documenté et structurée de façon cohérente. Essayez aussi de maintenir un historique git aussi propre que possible, et de ne pas casser une fonctionnalité lorsque vous en déployez une autre.

Par les choix qui ont été fait lors du début du développement, certaines technologies sont employées sans être indispensables (on aurait pu utiliser fastapi au lieu de flask par exemple), mais passer de l'une à l'autre n'est pas une mince affaire, surtout lorsqu'il s'agit de paramétrer correctement l'application backend, mais aussi le frontend, et le reverse proxy utilisé sur la machine virtuelle.

## II. Administration

Pour réduire les dépenses et mettre à profit le matériel du Rézal, le nouveau portail est hébergé sur une machine virtuelle du Rézal. C'est la même chose qu'avant, sauf que ça coûte rien et le service client est assuré par quelqu'un qui se trouve dans le même bâtiment.

### A - Mise à jour

Quand des commits sont ajoutés à la branche _prod_, cela déclenche automatiquement, grâce aux instructions se trouvant dans le fichier _.gitlab-ci.yml_, une mise à jour du site suivant les instructions se trouvant dans le fichier _update\_site.sh_. Cette mise à jour se fait en deux temps, d'abord une copie du nouveau code source du site, puis une mise à jour des différents composants.

### B - Base de données

La base de données est accessible en se connectant avec n'importe quel client de base de données. J'ai fait le choix de ne pas utiliser phpMyAdmin afin de ne pas exposer ce service à internet. En contrepartie, la bdd n'est acessible que depuis le Rézal.

Pour s'y connecter avec dbeaver : 
- Créer une nouvelle connexion.
  - Sélectionner MariaDB
  - Renseigner l'utilisateur *rezal* et le mot de passe.
  - Dans l'onglet en haut à droite, sélectionner SSH avec en hôte *10.100.1.20*, et en port *2223*. Username *rezal*, authentication method *Clé publique* et en clé SSH sélectionner le fichier qui contient votre clé privé, qui doit déjà être sur le serveur. Dans paramètres avancés, Implementation *SSHj*. Vous pouvez alors tester la connexion, et si elle marche cliquer sur valider.

Une fois connexté, vous pouvez lire la base de données, faire des modifications, modifier le schéma. Bref, tout est possible.

## III. Fonctionnement du site

Le site est composé de deux éléments : le frontend, ce qui tourne sur le navigateur des gens, et le backend, ce qui gère les données.

### A - Le backend

#### La première fois

Pour windows, passez par wsl. Il faut installer *valkey* pour permettre au chat, aux jeux et aux sondages de fonctionner.

1. **Installer les modules** : `conda env create -f environment.yml`
2. **Configurer l'application** : Créer un fichier `config.py` en copiant `config.example.py`, et en apportant les modifications voulues (il est bien configuré par défaut).
3. **Créer la base de données** : `python init_db.py`. Cela crée les tables à partir des modèles.
4. **Peupler l'environnement** : `python creer_environnement_dev.py`. Cela permet d'avoir des données à afficher.

Cette initialisation n'a lieu qu'une fois. Attention, si la structure de la base est modifiée, pour éviter les erreurs il est nécessaire de la supprimer puis de la recréer en exécutant à nouveau ce fichier ou d'ajouter les colonnes nécessaires.

#### À chaque fois

1. Le portail est démarré avec 
  - `gunicorn -k gevent -w 2 run:app -b localhost:5000` pour un fonctionnement au plus proche du déploiement. Pour le développement, on peut rajouter
    - `--reload` pour prendre en compte les modifications en temps réel
    - `--log-level debug` pour voir exactement ce qui se passe.
  -  Si `gunicorn` ne fonctionne pas `python run.py` suffit.

run.py fait appel à `__init__.py` qui crée l'application et démarre la base de donnée (`db = SQLAlchemy()`).  `config.py` contient la configuration utilisée lors de l'initialisation, elle contient le lien à la base, les clefs secrètes, etc.

2. Lorsque la base de données est modifiée :
  - `python init_db.py` permet de créer les nouvelles tables
  - pour ajouter des colonnes, il faut modifier à la main la base de données en veillant à persérver la cohérence entre la déclaration et la colonne créée dans la table (prendre les autres colonnes en exemple)

### B - Le frontend

1. **Installer les packets** : Installer *npm*, le gestionnaire de packets (l'équivalent de *pip* ou *conda* pour le javascript). Se placer dans *frontend* et exécuter `npm install`, ce qui installe tous les packets nécessaires (dont le besoin est indiqué dans `package.json`).
2. **Démarrer le serveur** : `npm run dev`, et on peut alors se connecter à l'adresse *http://localhost:5000*. La connexion se fait avec les logins créés lors de la création de l'environnement de dev, mdp 1234.


## III. Structure

Ce projet est une application web Flask, séparée en deux parties : le backend (côté serveur) et le frontend (côté client).

### A. Backend

Le backend est construit sur une architecture modulaire pour une maintenance et un développement facilités.

  - **`run.py`** : Point d'entrée de l'application. Lance un serveur de développement Flask.
  - **`app/__init__.py`** : Initialise l'application Flask, la base de données (SQLAlchemy), et charge la configuration.
  - **`config.py`** : Fichier de configuration contenant les variables d'environnement, les clés secrètes, et la configuration de la base de données.
  - **`app/models`** : Contient les modèles de données SQLAlchemy. Chaque fichier `models_*.py` definit la structure d'une table de la base de données.
  - **`app/controllers`** : Gère la logique de l'application et les routes de l'API. Chaque `controllers_*.py` regroupe les routes pour une fonctionnalité spécifique (par exemple, les utilisateurs, les événements).
  - **`app/services`** : Contient la logique métier de l'application, séparée des controllers pour une meilleure lisibilité.
  - **`app/utils`** : Fournit des fonctions utilitaires et des décorateurs, notamment pour la gestion des permissions.
  - **`app/tasks`** : Déclares les opérations réalisées à intervalles réguliers.
  - **`tests`** : Tests des fonctionnalités

### B. Frontend

Le frontend est une application React qui communique avec le backend via une API REST.

  - **`frontend/src/index.js`**: Point d'entrée de l'application React.
  - **`frontend/src/App.js`**: Composant principal de l'application, gère le routage des pages.
  - **`frontend/src/api`**: Contient les fonctions pour interagir avec l'API du backend. `base_url.js` définit l'URL du backend, et les autres fichiers `api_*.js` contiennent les appels à l'API pour chaque fonctionnalité.
  - **`frontend/src/components`**: Contient les composants React réutilisables.
  - **`frontend/src/pages`**: Contient les composants React qui représentent les pages de l'application.


## IV. Installation avec Podman

Cette méthode permet de lancer l'ensemble des services (frontend, backend, base de données, valkey, php-fpm) de manière isolée dans un conteneur. C'est multiplateforme, plus facile à utilisé (quand ça marche), et reproductible (pas de "Ça marche sur mon orinateur).

### A. Préparation

1. Le backend et le frontend doivent être déjà configurés avec les bons fichiers de configuration.
2. Créer le fichier de configuration pour la base de données : créez un fichier `.env` à la racine du projet avec les identifiants de base de données (coorespondants à `config.py`) :
```env
DB_NAME=portail
DB_USER=user
DB_PASSWORD=1234
DB_ROOT_PASSWORD=1234
```

### B - Lancement et Initialisation

1. **Démarrer les services** :
```bash
podman compose up -d --build
```

2.  **Charger la base de données** : Pour initialiser la base avec le backup SQL (`backup.sql`) :
```bash
podman compose exec -T mariadb mariadb -u root -p1234 portail < backup.sql
```

