# Fichiers de configuration de la VM

## Nginx

Utilisé comme reverse proxy
Fichier de configuration : */etc/nginx/sites-available/site*. Il faut ensuite créer un lien symbolique pour activer le site : 

```bash
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/site
sudo nginx -t
sudo nginx -s reload
```

## Systemd

Pour démarrer automatiquement le site au démarrage de la VM. Il faut créer le fichier */home/rezal/.config/systemd/user/site-backend.service*. Ensuite, on démarre le service : ```systemctl --user enable --now site-backend.service```.

Au besoin, on peut augmenter le nombre de processus en parallèle : il faut modifier le fichier, reload le daemon et redémarrer le service.

## MariaDB

La base de données est hebergée sur un hôte MariaDB. Pour s'y connecter : dans dbeaver, créer une nouvelle connexion. Sélectionner MariaDB, puis renseigner l'utilisateur *rezal* et le mot de passe. Dans l'onglet en haut à droite, sélectionner SSH avec en hôte *10.20.1.20*, et en port *2223*. Username *rezal*, authentication method *Clé publique* et en clé SSH sélectionner le fichier qui contient votre clé privé, qui doit déjà être sur le serveur. Dans paramètres avancés, Implementation *SSHj*. Vous pouvez alors tester la connexion, et si elle marche cliquer sur valider.