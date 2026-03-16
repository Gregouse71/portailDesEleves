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
    echo Arret du backend
    systemctl --user stop site-backend
    echo Mise a jour de l\'envirronement
    cd ..
    /home/rezal/miniconda3/bin/conda env update --file environment.yml --prune --quiet
    /home/rezal/miniconda3/envs/portail/bin/python init_db.py
    echo Redemarrage du front
    systemctl --user start site-backend

    echo Fini
    systemctl --user status site-backend
else
    echo Commande invalide
fi