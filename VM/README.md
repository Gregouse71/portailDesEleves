# Fichiers de configuration de la VM

## Nginx

Utilisé comme reverse proxy

```apacheconf
# /etc/nginx/sites-available/site
server {
        listen 80 default_server;
        listen [::]:80 default_server;

        server_name _;

        location /api {
                add_header       X-Served-By $host;
                proxy_set_header Host $host;
                proxy_set_header X-Forwarded-Scheme $scheme;
                proxy_set_header X-Forwarded-Proto  $scheme;
                proxy_set_header X-Forwarded-For    $remote_addr;
                proxy_set_header X-Real-IP          $remote_addr;
                proxy_pass http://127.0.0.1:5000$request_uri;
        }

        location /socket.io/ {
                proxy_pass http://127.0.0.1:5000/socket.io/;
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection "upgrade";
                proxy_set_header Host $host;
                proxy_read_timeout 3600;
                proxy_send_timeout 3600;
        }

        location /upload {
                alias /home/rezal/site/app/upload;
        }

        root /var/www/html/site;
        index index.html;

        location / {
                try_files $uri $uri/ /index.html;
        }
}
```

## Systemd

Pour démarrer automatiquement le site au démarrage de la VM

```
#/home/rezal/.config/systemd/user/site-backend.service
[Unit]
Description=Serveur pour le backend du site
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/rezal/site/
ExecStart=/home/rezal/miniconda3/envs/site/bin/gunicorn --worker-class eventlet -w 1 run:app -b localhost:5000

[Install]
WantedBy=multi-user.target
```