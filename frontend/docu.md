# Arborescence du frontend

```
frontend/
├── public/                 # Fichiers statiques servis tels quels (sons, images, etc.)
├── src/
│   ├── api/                # Clients HTTP et appels API vers le backend Flask
│   │   ├── base.js         # Configuration d'appel API et URLs de base
│   │   ├── api_*.js        # Modules d'appels API par domaine (associations, utilisateurs, soifguard...)
│   │   └── modules/        # Appels API spécifiques au modules d'associations
│   │
│   ├── assets/             # Ressources statiques importées par le bundler
│   │   ├── styles/         # Feuilles de style SCSS
│   │   └── icons/          # Icones SVG importés directement dans le code
│   │
│   ├── components/         # Composants réutilisables (hors pages de routage)
│   │   ├── blocs/          # Blocs latéraux du Layout (sondage, jeux, anniv, événements...)
│   │   ├── elements/       # Petits composants d'interface réutilisables (Post, RichEditor, DropdownEditer...)
│   │   └── templates/      # Gabarits réutilisables (PageRandom, BlocGlobal...)
│   │
│   ├── layouts/            # Structures de mise en page globales
│   │   └── Layout.jsx      # Mise en page principale (bannière, navigation, colonnes latérales, contenu)
│   │
│   ├── pages/              # Pages associées aux routes de l'application (regroupées par domaine)
│   │   ├── Admin/          # Administration du portail
│   │   ├── Auth/           # Authentification (Login, Direction)
│   │   ├── Home/           # Accueil, liste des associations, publications récentes, etc.
│   │   ├── Jeux/           # Pages des mini-jeux (2048, Echecs...)
│   │   ├── PageAsso/       # Page d'une association et ses onglets (infos, événements, membres, etc.)
│   │   ├── PageUtilisateur/# Profil utilisateur et ses onglets (infos, assos, questions, etc.)
│   │   ├── Soifguard/      # Interface d'encaissement Octo / Biero (Consommation, Opérations...)
│   │   ├── Sondage/        # Création, gestion et statistiques des sondages
│   │   └── Trombi/         # Trombinoscope, détails d'une promotion et arbre généalogique
│   │
│   ├── App.jsx             # Routeur principal et configuration globale (React Query, thèmes)
│   ├── Protected.jsx       # Garde d'authentification pour les routes protégées
│   └── index.jsx           # Point d'entrée React
├── index.html              # Template HTML racine (Vite)
├── vite.config.js          # Configuration de Vite (build, proxy de dev)
└── package.json            # Dépendances et scripts npm
```
