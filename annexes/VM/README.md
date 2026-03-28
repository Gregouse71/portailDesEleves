# Fichiers de configuration de la VM

La machine virtuelle qui héberge le site doit être configurée.

## Nginx

Utilisé comme reverse proxy
Fichier de configuration : */etc/nginx/sites-available/site*. Il faut ensuite créer un lien symbolique pour activer le site : 

```bash
sudo systemctl enable --now nginx
cd /etc/nginx/sites-enabled
sudo ln -s ../sites-available/site
sudo nginx -t
sudo nginx -s reload
```

## Systemd

Pour démarrer automatiquement le site au démarrage de la VM. Il faut créer le fichier */home/rezal/.config/systemd/user/site-backend.service*. Ensuite, on démarre le service : ```systemctl --user enable --now site-backend.service```.

Au besoin, on peut augmenter le nombre de processus en parallèle : il faut modifier le fichier, reload le daemon et redémarrer le service.

## SSH

Il faut d'abord autoriser les connexions SSH avec la clé du runner gitlab, trouvable sur la VM gitlab, et restreindre la commande exécutable en SSH par cet utilisateur dans _/home/rezal/.ssh/authorized\_keys_ :
```
command="/home/rezal/update_site.sh",no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBCXIbLggLZR8cxA9+870svRB3GXsewRDDpQ5rmpEfOC gitlab-runner@GitLab
```

## Mariadb

MariaDB est le système de bdd utilisé. Il faut l'installer, l'activer, puis tout peut être fait depuis dbeaver.
```bash
sudo apt install mariadb-server
sudo systemctl enable --now mariadb
```