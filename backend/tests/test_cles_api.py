import pytest

from app.models import Utilisateur
from app.models.models_cles_api import CleAPI
from app.services.services_cles_api import promo_1a_actuelle, est_2a_et_plus

# Tests de la brique API annuaire : clés personnelles (gate 2A+), endpoint
# /api/annuaire/liste (X-API-Key), champ strict, pagination, audit.


@pytest.fixture()
def db_cles(app, db_initialized):
    """Un 1A (promo courante) et un 2A (promo - 1), indépendants du calendrier."""
    promo_1a = int(promo_1a_actuelle())
    un_a = Utilisateur(nom_utilisateur=f"{promo_1a}unA", prenom="Une", nom="Premiereannee",
                       promotion=promo_1a, email="unA@exemple.com", cycle="ic",
                       mot_de_passe_en_clair="1234")
    deux_a = Utilisateur(nom_utilisateur=f"{promo_1a - 1}deuxA", prenom="Deux", nom="Deuxiemeannee",
                         promotion=promo_1a - 1, email="deuxA@exemple.com", cycle="ic",
                         mot_de_passe_en_clair="1234")
    db_initialized.session.add_all([un_a, deux_a])
    db_initialized.session.commit()
    yield db_initialized, un_a, deux_a
    db_initialized.session.remove()


def _client(app, username):
    client = app.test_client()
    r = client.post('/api/login/connexion', json={'username': username, 'password': '1234'})
    assert r.status_code == 200
    return client


def _creer_cle(client, nom="test"):
    r = client.post('/api/cles/creer', json={'nom': nom})
    assert r.status_code == 201
    return r.get_json()


class TestGateDeuxA:

    def test_est_2a_et_plus(self, app, db_cles):
        _, un_a, deux_a = db_cles
        assert est_2a_et_plus(deux_a)
        assert not est_2a_et_plus(un_a)

    def test_1a_ne_peut_pas_creer(self, app, db_cles):
        _, un_a, _deux_a = db_cles
        client = _client(app, un_a.nom_utilisateur)
        r = client.post('/api/cles/creer', json={'nom': 'interdite'})
        assert r.status_code == 403
        assert CleAPI.query.count() == 0

    def test_liste_indique_eligibilite(self, app, db_cles):
        _, un_a, _deux_a = db_cles
        client = _client(app, un_a.nom_utilisateur)
        r = client.get('/api/cles/liste')
        assert r.status_code == 200
        assert r.get_json()["eligible"] is False


class TestCreationEtGestion:

    def test_creation_2a(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client(app, deux_a.nom_utilisateur)
        data = _creer_cle(client, "equipaps prod")
        assert data["valeur"].startswith("pak_")
        cle = CleAPI.query.first()
        assert cle.nom == "equipaps prod"
        assert cle.revoked is False
        assert cle.hash != data["valeur"]          # jamais la valeur en clair
        assert cle.user_id == deux_a.id

    def test_maximum_trois_cles_actives(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client(app, deux_a.nom_utilisateur)
        for _ in range(3):
            _creer_cle(client)
        r = client.post('/api/cles/creer', json={'nom': 'trop'})
        assert r.status_code == 400

    def test_revocation_d_un_autre_refusee(self, app, db_cles):
        _, un_a, deux_a = db_cles
        client_2a = _client(app, deux_a.nom_utilisateur)
        data = _creer_cle(client_2a)
        client_1a = _client(app, un_a.nom_utilisateur)
        r = client_1a.post(f"/api/cles/revoquer/{data['cle']['id']}")
        assert r.status_code == 404
        assert CleAPI.query.first().revoked is False


class TestAnnuaire:

    def test_sans_cle_refuse(self, app, db_cles):
        client = app.test_client()
        r = client.get('/api/annuaire/liste')
        assert r.status_code == 401

    def test_mauvaise_cle_refusee(self, app, db_cles):
        client = app.test_client()
        r = client.get('/api/annuaire/liste', headers={"X-API-Key": "pak_fausse"})
        assert r.status_code == 401

    def test_champ_strict_et_pagination(self, app, db_cles):
        _, un_a, deux_a = db_cles
        client = _client(app, deux_a.nom_utilisateur)
        valeur = _creer_cle(client)["valeur"]

        r = app.test_client().get('/api/annuaire/liste?per_page=1&page=1',
                                  headers={"X-API-Key": valeur})
        assert r.status_code == 200
        data = r.get_json()
        assert data["total"] == 2 and data["pages"] == 2 and data["per_page"] == 1
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert set(item.keys()) == {"id", "nom_utilisateur", "prenom", "nom",
                                    "email", "promotion", "cycle", "photo"}
        assert "telephone" not in item and "date_de_naissance" not in item

    def test_filtre_promo(self, app, db_cles):
        _, un_a, deux_a = db_cles
        client = _client(app, deux_a.nom_utilisateur)
        valeur = _creer_cle(client)["valeur"]
        r = app.test_client().get(f'/api/annuaire/liste?promo={un_a.promotion}',
                                  headers={"X-API-Key": valeur})
        data = r.get_json()
        assert data["total"] == 1
        assert data["items"][0]["nom_utilisateur"] == un_a.nom_utilisateur

    def test_audit_utilisation(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client(app, deux_a.nom_utilisateur)
        valeur = _creer_cle(client)["valeur"]
        test_client = app.test_client()
        test_client.get('/api/annuaire/liste', headers={"X-API-Key": valeur})
        test_client.get('/api/annuaire/liste', headers={"X-API-Key": valeur})
        cle = CleAPI.query.first()
        assert cle.use_count == 2
        assert cle.last_used_at is not None

    def test_cle_revoquee_refusee(self, app, db_cles):
        _, _un_a, deux_a = db_cles
        client = _client(app, deux_a.nom_utilisateur)
        data = _creer_cle(client)
        r = client.post(f"/api/cles/revoquer/{data['cle']['id']}")
        assert r.status_code == 200
        r = app.test_client().get('/api/annuaire/liste', headers={"X-API-Key": data["valeur"]})
        assert r.status_code == 401

    def test_cle_d_un_jeune_refusee(self, app, db_cles):
        # branche de garde : une clé ne devrait jamais appartenir à un 1A
        # (création refusée), mais l'annuaire re-vérifie à l'usage.
        _, un_a, _deux_a = db_cles
        from app.models.models_cles_api import generer_cle
        valeur, empreinte = generer_cle()
        from app import db as _db
        _db.session.add(CleAPI(user_id=un_a.id, nom="frauduleuse", hash=empreinte))
        _db.session.commit()
        r = app.test_client().get('/api/annuaire/liste', headers={"X-API-Key": valeur})
        assert r.status_code == 403


class TestAnniversaires:
    """Endpoint /api/annuaire/anniversaires?du=MM-JJ&au=MM-JJ."""

    @pytest.fixture()
    def db_anniv(self, app, db_initialized):
        from datetime import date
        p = int(promo_1a_actuelle())
        users = [
            Utilisateur(f"{p-2}nov5", "Anna", "Novcinq", p - 2, "a1@x.com", "ic", "1234", date_de_naissance=date(2004, 11, 5)),
            Utilisateur(f"{p-2}nov10", "Bruno", "Novdix", p - 2, "a2@x.com", "ic", "1234", date_de_naissance=date(2003, 11, 10)),
            Utilisateur(f"{p-3}dec30", "Chloe", "Dectrente", p - 3, "a3@x.com", "ic", "1234", date_de_naissance=date(2002, 12, 30)),
            Utilisateur(f"{p-3}jan2", "David", "Jandeux", p - 3, "a4@x.com", "ic", "1234", date_de_naissance=date(2003, 1, 2)),
            Utilisateur(f"{p-1}sans", "Elsa", "Sansdate", p - 1, "a5@x.com", "ic", "1234"),
        ]
        db_initialized.session.add_all(users)
        db_initialized.session.commit()
        yield db_initialized
        db_initialized.session.remove()

    def _client_avec_cle(self, app, db_anniv):
        client = app.test_client()
        r = client.post('/api/login/connexion', json={'username': f"{int(promo_1a_actuelle())-2}nov5", 'password': '1234'})
        assert r.status_code == 200
        r = client.post('/api/cles/creer', json={'nom': 'test anniv'})
        assert r.status_code == 201
        return r.get_json()["valeur"]

    def test_plage_simple(self, app, db_anniv):
        cle = self._client_avec_cle(app, db_anniv)
        r = app.test_client().get('/api/annuaire/anniversaires?du=11-02&au=11-08',
                                   headers={"X-API-Key": cle})
        assert r.status_code == 200
        data = r.get_json()
        assert data["total"] == 1
        assert data["items"][0]["nom_utilisateur"].endswith("nov5")
        assert data["items"][0]["anniversaire"] == "11-05"
        assert "date_de_naissance" not in data["items"][0]

    def test_repli_fin_annee(self, app, db_anniv):
        cle = self._client_avec_cle(app, db_anniv)
        r = app.test_client().get('/api/annuaire/anniversaires?du=12-30&au=01-05',
                                   headers={"X-API-Key": cle})
        data = r.get_json()
        assert data["total"] == 2
        # trié depuis le debut demandé : 12-30 puis 01-02
        assert [i["anniversaire"] for i in data["items"]] == ["12-30", "01-02"]

    def test_parametres_invalides(self, app, db_anniv):
        cle = self._client_avec_cle(app, db_anniv)
        for q in ("", "?du=11-02", "?du=abc&au=11-08", "?du=13-01&au=11-08"):
            r = app.test_client().get(f'/api/annuaire/anniversaires{q}', headers={"X-API-Key": cle})
            assert r.status_code == 400, q

    def test_sans_cle_refuse(self, app, db_anniv):
        r = app.test_client().get('/api/annuaire/anniversaires?du=11-02&au=11-08')
        assert r.status_code == 401

    def test_anciens_exclus_par_defaut(self, app, db_anniv):
        from datetime import date
        from app import db as _db
        from app.models import Utilisateur as U
        p = int(promo_1a_actuelle())
        vieux = U(f"{p-9}vieux", "Yann", "Ancien", p - 9, "vieux@x.com", "ic", "1234",
                 date_de_naissance=date(1990, 11, 3))
        _db.session.add(vieux)
        _db.session.commit()
        cle = self._client_avec_cle(app, db_anniv)
        r = app.test_client().get('/api/annuaire/anniversaires?du=11-02&au=11-08',
                                  headers={"X-API-Key": cle})
        assert r.status_code == 200
        assert all(i["promotion"] != str(p - 9) for i in r.get_json()["items"])
        r = app.test_client().get('/api/annuaire/anniversaires?du=11-02&au=11-08&toutes=1',
                                  headers={"X-API-Key": cle})
        assert any(i["promotion"] == str(p - 9) for i in r.get_json()["items"])
