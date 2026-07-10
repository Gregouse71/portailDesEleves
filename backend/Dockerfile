FROM docker.io/anaconda/miniconda:latest

WORKDIR /app

# Creation de l'environnement conda
COPY environment.yml ./
RUN conda tos accept
RUN conda env create --file environment.yml

# Installation de la locale
RUN apt-get update && apt-get install -y locales && \
    sed -i '/fr_FR.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen && \
    rm -rf /var/lib/apt/lists/*

ENV LANG=fr_FR.UTF-8
ENV LC_ALL=fr_FR.UTF-8

# Copie des fichier utilisés par le backend
COPY run.py ./
COPY config.docker.py ./config.py
COPY app/ ./app/

EXPOSE 5000

CMD ["conda", "run", "--no-capture-output", "-n", "portail", \
    "gunicorn", "--worker-class", "geventwebsocket.gunicorn.workers.GeventWebSocketWorker", \
    "-b", "0.0.0.0:5000", "-w", "5", "run:app"]
