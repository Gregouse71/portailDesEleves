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
