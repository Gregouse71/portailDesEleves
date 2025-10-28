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

Pour démarrer automatiquement le site au démarrage de la VM. Il faut créer les fichier */home/rezal/.config/systemd/user/site-backend@.service* et */home/rezal/.config/systemd/user/site-backend-main.service*. Pour déclarer les services. Ensuite, on crée plusieurs workers qui 
