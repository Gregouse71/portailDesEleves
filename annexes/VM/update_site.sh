#!/bin/bash
# Script de mise à jour du portail des élèves par unner gitlab
# avec limitation maximale des permissions données à la clé
# Par Grégoire Girardet

if [[ "$SSH_ORIGINAL_COMMAND" == rsync* ]]; then
    /usr/bin/rrsync -wo /home/rezal/site

# Si c'est la mise à jour
elif [[ "$SSH_ORIGINAL_COMMAND" == "update-site" ]]; then
    set -e
    cp config.py site
    cd /home/rezal/site

    echo Frontend
    cd frontend
    echo Installation des packets
    npm install --omit=dev
    echo Compilation
    npm run build
    echo Copie dans le dossier approprié
    cp -r build/* /var/www/html/site
    echo Fin frontend

    echo Backend
    cd ..

    ENV_CACHE="/home/rezal/.env_cache.md5"
    CURRENT_HASH=$(md5sum environment.yml | cut -d' ' -f1)

    if [ ! -f "$ENV_CACHE" ] || [ "$(cat $ENV_CACHE)" != "$CURRENT_HASH" ]; then
        echo Environnement modifié : mise à jour...
        systemctl stop --user site-backend
        /home/rezal/miniconda3/bin/conda env update --file environment.yml --prune --quiet
        systemctl --user start site-backend
        echo "$CURRENT_HASH" > "$ENV_CACHE"
    else
        echo Environnement non modifié : simple redémarrage
        systemctl reload --user site-backend
    fi

    /home/rezal/miniconda3/envs/portail/bin/python init_db.py

    echo Fini
    systemctl --user status site-backend
else
    echo Commande invalide
fi