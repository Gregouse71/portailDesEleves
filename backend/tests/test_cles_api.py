import time
from datetime import datetime, timedelta, timezone

import pytest

from app.models import Utilisateur
from app.models.models_cles_api import CleAPI
from app.services.services_login import has_permission

# Tests des clés d'API personnelles : permission cle_api, création, révocation,
# authentification par X-API-Key, audit d'utilisation.


@pytest.fixture()
def heure_de_paris(monkeypatch):
    """Heure locale de Paris, en avance sur l'UTC stocké en base."""
    monkeypatch.setenv("TZ", "Europe/Paris")
    time.tzset()
    yield
    monkeypatch.undo()
    time.tzset()


def _client_bearer(app, username):
    client = app.test_client()
    r = client.post('/api/login/connexion', json={'username': username, 'password': '1234'})
    assert r.status_code == 200
    return client


def _creer_cle(client, nom="test"):
    r = client.post('/api/cles/creer', json={'nom': nom})
    assert r.status_code == 201
    return r.get_json()


class TestPermissionCleApi:

    def test_permission_api(self, app, db_cles):
        _, un_a, deux_a = db_cles
        assert has_permission(deux_a, "cle_api")
        assert not has_permission(un_a, "cle_api")

    def test_sans_permission_ne_peut_pas_creer(self, app, db_cles):
        _, un_a, _deux_a = db_cles
        client = _client_bearer(app, un_a.nom_utilisateur)
        r = client.post('/api/cles/creer', json={'nom': 'interdite'})
        assert r.status_code == 403
        assert CleAPI.query.count() == 0

    def test_liste_indique_eligibilite(self, app, db_cles):
        _, un_a, _deux_a = db_cles
        client = _client_bearer(app, un_a.nom_utilisateur)
        r = client.get('/api/cles/liste')
        assert r.status_code == 200
        assert r.get_json()["eligible_api"] is False


class TestCreationEtGestion:

    def test_creation(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client_bearer(app, deux_a.nom_utilisateur)
        data = _creer_cle(client, "equipaps prod")
        assert data["valeur"].startswith("pak_")
        cle = CleAPI.query.filter_by(id=data["cle"]["id"]).first()
        assert cle.nom == "equipaps prod"
        assert cle.revoked is False
        assert cle.hash != data["valeur"]          # jamais la valeur en clair
        assert cle.utilisateur_id == deux_a.id

    def test_nom_obligatoire(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client_bearer(app, deux_a.nom_utilisateur)
        for nom in (None, "   ", "x" * 101):
            r = client.post('/api/cles/creer', json={'nom': nom})
            assert r.status_code == 400, nom
        assert CleAPI.query.count() == 0

    def test_maximum_trois_cles_actives(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client_bearer(app, deux_a.nom_utilisateur)
        for _ in range(3):
            _creer_cle(client)
        r = client.post('/api/cles/creer', json={'nom': 'trop'})
        assert r.status_code == 400

    def test_revocation_d_un_autre_refusee(self, app, db_cles):
        _, un_a, deux_a = db_cles
        client_2a = _client_bearer(app, deux_a.nom_utilisateur)
        data = _creer_cle(client_2a)
        client_1a = _client_bearer(app, un_a.nom_utilisateur)
        r = client_1a.delete(f"/api/cles/revoquer/{data['cle']['id']}")
        assert r.status_code == 404
        assert CleAPI.query.first().revoked is False

    def test_revocation_garde_l_historique(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client_bearer(app, deux_a.nom_utilisateur)
        data = _creer_cle(client)
        r = client.delete(f"/api/cles/revoquer/{data['cle']['id']}")
        assert r.status_code == 200
        cles = client.get('/api/cles/liste').get_json()["cles"]
        assert [(c["revoked"], c["active"]) for c in cles] == [(True, False)]

    def test_superutilisateur_revoque_toutes_les_cles(self, app, db_cles):
        db_init, _un_a, deux_a = db_cles
        admin = Utilisateur(nom_utilisateur="admin", prenom="Admin", nom="Nom", promotion=23,
                            email="admin@example.com", cycle="de", mot_de_passe_en_clair="1234")
        admin.est_superutilisateur = True
        db_init.session.add_all([admin, CleAPI(deux_a, "une"), CleAPI(deux_a, "deux")])
        db_init.session.commit()
        r = _client_bearer(app, deux_a.nom_utilisateur).delete(f"/api/cles/revoquer_tout/{deux_a.id}")
        assert r.status_code == 403
        client = _client_bearer(app, admin.nom_utilisateur)
        r = client.delete(f"/api/cles/revoquer_tout/{deux_a.id}")
        assert r.status_code == 200
        assert [c.revoked for c in CleAPI.query.all()] == [True, True]

    def test_cles_expirees_hors_maximum(self, app, db_cles):
        db_init, _un_a, deux_a = db_cles
        for _ in range(3):
            cle = CleAPI(deux_a, "ancienne")
            cle.expires_on = datetime(2020, 1, 1)
            db_init.session.add(cle)
        db_init.session.commit()
        client = _client_bearer(app, deux_a.nom_utilisateur)
        _creer_cle(client)
        cles = client.get('/api/cles/liste').get_json()["cles"]
        assert sorted(c["active"] for c in cles) == [False, False, False, True]

    def test_expiration_comparee_en_utc(self, app, db_cles, heure_de_paris):
        db_init, _un_a, deux_a = db_cles
        cle = CleAPI(deux_a, "encore valable")
        cle.expires_on = datetime.now(timezone.utc) + timedelta(minutes=30)
        db_init.session.add(cle)
        db_init.session.commit()

        r = app.test_client().get('/api/users/prochains_anniv', headers={"X-API-Key": cle.valeur})
        assert r.status_code == 200

    def test_sans_cle_refuse(self, app, db_cles):
        client = app.test_client()
        r = client.get('/api/users/prochains_anniv')
        assert r.status_code == 401

    def test_mauvaise_cle_refusee(self, app, db_cles):
        client = app.test_client()
        r = client.get('/api/users/prochains_anniv', headers={"X-API-Key": "pak_fausse"})
        assert r.status_code == 401

    def test_audit_utilisation(self, app, db_cles):
        db_init, _un_a, deux_a = db_cles

        cle = CleAPI(deux_a, "Cle test")
        db_init.session.add(cle)
        db_init.session.commit()

        cle1 = CleAPI.query.filter_by(id=cle.id).first()
        assert cle1.use_count == 0

        client = app.test_client()
        client.get('/api/users/prochains_anniv', headers={"X-API-Key": cle.valeur})

        cle2 = CleAPI.query.filter_by(id=cle.id).first()
        assert cle2.use_count == 1
        assert cle2.last_used_at is not None

    def test_cle_revoquee_refusee(self, app, db_cles):
        db_init, _, deux_a = db_cles

        cle = CleAPI(deux_a, "Cle test")
        cle.revoked = True
        db_init.session.add(cle)
        db_init.session.commit()

        client = app.test_client()
        r = client.get('/api/users/prochains_anniv', headers={"X-API-Key": cle.valeur})
        assert r.status_code == 401

    def test_cle_route_interdite_refusee(self, app, db_cles):
        db_init, _, deux_a = db_cles

        cle = CleAPI(deux_a, "Cle test")
        db_init.session.add(cle)
        db_init.session.commit()

        client = app.test_client()
        r = client.post('/api/cles/creer', headers={"X-API-Key": cle.valeur})
        assert r.status_code == 401

    def test_cle_sans_permission_refusee(self, app, db_cles):
        db_init, un_a, _ = db_cles

        cle = CleAPI(un_a, "Cle test")
        db_init.session.add(cle)
        db_init.session.commit()

        r = app.test_client().get('/api/users/prochains_anniv', headers={"X-API-Key": cle.valeur})
        assert r.status_code == 401
