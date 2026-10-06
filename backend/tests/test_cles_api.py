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
        assert r.get_json()["eligible"] is False


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


class TestAnnuaire:

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

    def test_cle_d_un_jeune_refusee(self, app, db_cles):
        db_init, un_a, _ = db_cles

        valeur, empreinte = generer_cle()
        cle = CleAPI(utilisateur=un_a, nom="Cle test", hash=empreinte)
        db_init.session.add(cle)
        db_init.session.commit()

        r = app.test_client().get('/api/users/prochains_anniv', headers={"X-API-Key": valeur})
        assert r.status_code == 401


p = 26
class TestAnniversaires:
    """Endpoint /api/annuaire/anniversaires?du=MM-JJ&au=MM-JJ."""

    @pytest.fixture()
    def db_anniv(self, app, db_initialized):
        from datetime import date
        users = [
            Utilisateur(f"{p-2}nov5", "Anna", "Novcinq", p - 2, "a1@x.com", "ic", "1234", date_de_naissance=date(2004, 11, 5)),
            Utilisateur(f"{p-2}nov10", "Bruno", "Novdix", p - 2, "a2@x.com", "ic", "1234", date_de_naissance=date(2003, 11, 10)),
            Utilisateur(f"{p-3}dec30", "Chloe", "Dectrente", p - 3, "a3@x.com", "ic", "1234", date_de_naissance=date(2002, 12, 30)),
            Utilisateur(f"{p-3}jan2", "David", "Jandeux", p - 3, "a4@x.com", "ic", "1234", date_de_naissance=date(2003, 1, 2)),
            Utilisateur(f"{p-1}sans", "Elsa", "Sansdate", p - 1, "a5@x.com", "ic", "1234"),
        ]
        db_initialized.session.add_all(users)
        db_initialized.session.commit()
        yield db_initialized, users[0]
        db_initialized.session.remove()

    def _client_avec_cle(self, app, db_anniv):
        client = app.test_client()
        r = client.post('/api/login/connexion', json={'username': f"{p - 2}nov5", 'password': '1234'})
        assert r.status_code == 200
        r = client.post('/api/cles/creer', json={'nom': 'test anniv'})
        assert r.status_code == 201
        return r.get_json()["valeur"]

    def test_plage_simple(self, app, db_anniv):
        _, user = db_anniv
        client = _client_bearer(app, user.nom_utilisateur)
        r = client.get('/api/users/prochains_anniv?debut=2026-11-02&fin=2026-11-08')
        assert r.status_code == 200
        data = r.get_json()
        assert len(data) == 1
        assert data[0][1][0][0] == "Anna"
        assert data[0][0] == "Sun, 05 Nov 2000 00:00:00 GMT"

    def test_repli_fin_annee(self, app, db_anniv):
        _, user = db_anniv
        client = _client_bearer(app, user.nom_utilisateur)
        r = client.get('/api/users/prochains_anniv?debut=2026-12-30&fin=2027-01-05')
        data = r.get_json()
        assert len(data) == 2
        # trié depuis le debut demandé : 12-30 puis 01-02
        assert data[0][1][0][0] == "Chloe"
        assert data[1][1][0][0] == "David"

    def test_parametres_invalides(self, app, db_anniv):
        _, user = db_anniv
        client = _client_bearer(app, user.nom_utilisateur)
        for q in ("?debut=11-02", "?debut=abc&fin=2026-11-08", "?debut=2026-13-01&fin=11-08"):
            r = client.get(f'/api/users/prochains_anniv{q}')
            assert r.status_code == 400, q

    def test_anciens_exclus_par_defaut(self, app, db_anniv):
        _, user = db_anniv
        client = _client_bearer(app, user.nom_utilisateur)

        from datetime import date
        from app import db as _db
        from app.models import Utilisateur as U

        vieux = U(f"{p-9}vieux", "Yann", "Ancien", p - 9, "vieux@x.com", "ic", "1234",
                 date_de_naissance=date(1990, 5, 3))
        _db.session.add(vieux)
        _db.session.commit()

        r = client.get('/api/users/prochains_anniv?du=2026-05-02&au=2026-05-08')
        assert r.status_code == 200
        assert len(r.get_json()) == 0
