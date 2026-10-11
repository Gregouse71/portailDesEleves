import pytest

from app.models import Utilisateur
from app.models.models_cles_api import CleAPI, generer_cle
from app.models.models_divers import Permission
from app.services.services_login import has_permission

# Tests de la brique API annuaire : clés personnelles (gate 2A+), endpoint
# /api/annuaire/liste (X-API-Key), champ strict, pagination, audit.


@pytest.fixture()
def db_cles(app, db_initialized):
    """Un 1A (promo courante) et un 2A (promo - 1), indépendants du calendrier."""
    un_a = Utilisateur(nom_utilisateur="22unA", prenom="Une", nom="Premiereannee",
                       promotion=22, email="unA@exemple.com", cycle="ic",
                       mot_de_passe_en_clair="1234")
    deux_a = Utilisateur(nom_utilisateur="21deuxA", prenom="Deux", nom="Deuxiemeannee",
                         promotion=21, email="deuxA@exemple.com", cycle="ic",
                         mot_de_passe_en_clair="1234")
    perm = Permission(deux_a, "cle_api")

    db_initialized.session.add_all([un_a, deux_a, perm])
    db_initialized.session.commit()
    yield db_initialized, un_a, deux_a
    db_initialized.session.remove()


def _client_bearer(app, username):
    client = app.test_client()
    r = client.post('/api/login/connexion', json={'username': username, 'password': '1234'})
    assert r.status_code == 200
    return client


def _creer_cle(client, nom="test"):
    r = client.post('/api/cles/creer', json={'nom': nom})
    assert r.status_code == 201
    return r.get_json()


class TestGateDeuxA:

    def test_permission_api(self, app, db_cles):
        _, un_a, deux_a = db_cles
        assert has_permission(deux_a, "cle_api")
        assert not has_permission(un_a, "cle_api")

    def test_1a_ne_peut_pas_creer(self, app, db_cles):
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

    def test_creation_2a(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client_bearer(app, deux_a.nom_utilisateur)
        data = _creer_cle(client, "equipaps prod")
        assert data["valeur"].startswith("pak_")
        cle = CleAPI.query.filter_by(id=data["cle"]["id"]).first()
        assert cle.nom == "equipaps prod"
        assert cle.revoked is False
        assert cle.hash != data["valeur"]          # jamais la valeur en clair
        assert cle.utilisateur_id == deux_a.id

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
        r = client_1a.post(f"/api/cles/revoquer/{data['cle']['id']}")
        assert r.status_code == 404
        assert CleAPI.query.first().revoked is False

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

        valeur, empreinte = generer_cle()
        cle = CleAPI(utilisateur=deux_a, nom="Cle test", hash=empreinte)
        db_init.session.add(cle)
        db_init.session.commit()

        cle1 = CleAPI.query.filter_by(id=cle.id).first()
        assert cle1.use_count == 0

        client = app.test_client()
        client.get('/api/users/prochains_anniv', headers={"X-API-Key": valeur})

        cle2 = CleAPI.query.filter_by(id=cle.id).first()
        assert cle2.use_count == 1
        assert cle2.last_used_at is not None

    def test_cle_revoquee_refusee(self, app, db_cles):
        db_init, _, deux_a = db_cles

        valeur, empreinte = generer_cle()
        cle = CleAPI(utilisateur=deux_a, nom="Cle test", hash=empreinte, revoked=True)
        db_init.session.add(cle)
        db_init.session.commit()

        client = app.test_client()
        r = client.get('/api/users/prochains_anniv', headers={"X-API-Key": valeur})
        assert r.status_code == 401

    def test_cle_route_interdite_refusee(self, app, db_cles):
        db_init, _, deux_a = db_cles

        valeur, empreinte = generer_cle()
        cle = CleAPI(utilisateur=deux_a, nom="Cle test", hash=empreinte)
        db_init.session.add(cle)
        db_init.session.commit()

        client = app.test_client()
        r = client.post('/api/cles/creer', headers={"X-API-Key": valeur})
        assert r.status_code == 401

    def test_cle_d_un_jeune_refusee(self, app, db_cles):
        db_init, un_a, _ = db_cles

        valeur, empreinte = generer_cle()
        cle = CleAPI(utilisateur=un_a, nom="Cle test", hash=empreinte)
        db_init.session.add(cle)
        db_init.session.commit()

        r = app.test_client().get('/api/users/prochains_anniv', headers={"X-API-Key": valeur})
        assert r.status_code == 401
