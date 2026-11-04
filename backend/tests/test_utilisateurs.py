import pytest

from app.models.models_cles_api import CleAPI
from app.models.models_utilisateurs import Utilisateur

infos = {
    "nom_utilisateur": "test",
    "email": "test@example.com",
    "nom": "Test",
    "prenom": "Test",
    "cycle": "ic",
    "promotion": "23",
    "mot_de_passe_en_clair": "1234"
}

class TestUtilisateurs:        
    def test_permissions_ajout_utilisateur(self, app, db_with_users, client_factory_user_win):
        with client_factory_user_win() as user:
            r = user.post('/api/users/add_utilisateur', json=infos)
            assert r.status_code == 403
    # def test_ajout_utilisateur(self, app, db_with_admin, client_factory_admin):
    #     with client_factory_admin() as admin:
    #         r = admin.post('/api/users/add_utilisateur', json=infos)
    #         assert r.status_code == 203


p = 26
class TestAnniversaires:
    """Endpoint /api/users/prochains_anniv?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ."""

    @pytest.fixture()
    def db_anniv(self, app, db_with_users):
        db, _ = db_with_users
        from datetime import date
        users = [
            Utilisateur(f"{p-2}nov5", "Anna", "Novcinq", p - 2, "a1@x.com", "ic", "1234", date_de_naissance=date(2004, 11, 5)),
            Utilisateur(f"{p-2}nov10", "Bruno", "Novdix", p - 2, "a2@x.com", "ic", "1234", date_de_naissance=date(2003, 11, 10)),
            Utilisateur(f"{p-3}dec30", "Chloe", "Dectrente", p - 3, "a3@x.com", "ic", "1234", date_de_naissance=date(2002, 12, 30)),
            Utilisateur(f"{p-3}jan2", "David", "Jandeux", p - 3, "a4@x.com", "ic", "1234", date_de_naissance=date(2003, 1, 2)),
            Utilisateur(f"{p-1}sans", "Elsa", "Sansdate", p - 1, "a5@x.com", "ic", "1234"),
            Utilisateur(f"{p-9}vieux", "Yann", "Ancien", p - 9, "vieux@x.com", "ic", "1234", date_de_naissance=date(1990, 5, 3))
        ]
        db.session.add_all(users)
        db.session.commit()
        yield db, users[0]
        db.session.remove()

    def test_plage_simple(self, app, client_factory_user, db_anniv):
        with client_factory_user() as client:
            r = client.get('/api/users/prochains_anniv?debut=2026-11-02&fin=2026-11-08')
            assert r.status_code == 200
            data = r.get_json()
            assert len(data) == 1
            assert data[0][1][0][0] == "Anna"
            assert data[0][0] == "Sun, 05 Nov 2000 00:00:00 GMT"

    def test_repli_fin_annee(self, app, client_factory_user, db_anniv):
        with client_factory_user() as client:
            r = client.get('/api/users/prochains_anniv?debut=2026-12-30&fin=2027-01-05')
            data = r.get_json()
            assert len(data) == 2
            # trié depuis le debut demandé : 12-30 puis 01-02
            assert data[0][1][0][0] == "Chloe"
            assert data[1][1][0][0] == "David"

    def test_parametres_invalides(self, app, client_factory_user, db_anniv):
        with client_factory_user() as client:
            for q in ("?debut=11-02", "?debut=abc&fin=2026-11-08", "?debut=2026-13-01&fin=11-08"):
                r = client.get(f'/api/users/prochains_anniv{q}')
                assert r.status_code == 400, q

    def test_anciens_exclus_par_defaut(self, app, client_factory_user, db_anniv):
        with client_factory_user() as client:
            r = client.get('/api/users/prochains_anniv?debut=2026-05-02&fin=2026-05-08')
            assert r.status_code == 200
            assert len(r.get_json()) == 0


def _cle_en_base(db_init, utilisateur):
    cle = CleAPI(utilisateur, "Cle test")
    db_init.session.add(cle)
    db_init.session.commit()
    return cle.valeur


class TestAnnuaire:

    def test_sans_cle_refuse(self, app, db_cles):
        r = app.test_client().get('/api/users/annuaire')
        assert r.status_code == 401

    def test_cle_sans_permission_refusee(self, app, db_cles):
        db_init, un_a, _ = db_cles
        valeur = _cle_en_base(db_init, un_a)
        r = app.test_client().get('/api/users/annuaire', headers={"X-API-Key": valeur})
        assert r.status_code == 401

    def test_champs_stricts(self, app, db_cles):
        db_init, _, deux_a = db_cles
        valeur = _cle_en_base(db_init, deux_a)
        r = app.test_client().get('/api/users/annuaire', headers={"X-API-Key": valeur})
        assert r.status_code == 200
        data = r.get_json()
        assert data["total"] == 2
        assert {u["nom_utilisateur"] for u in data["items"]} == {"22unA", "21deuxA"}
        assert set(data["items"][0]) == {"id", "nom_utilisateur", "prenom", "nom", "email",
                                         "promotion", "cycle", "photo"}

    def test_pagination_et_filtres(self, app, db_cles):
        db_init, un_a, deux_a = db_cles
        valeur = _cle_en_base(db_init, deux_a)
        client = app.test_client()
        r = client.get('/api/users/annuaire?per_page=1&page=2', headers={"X-API-Key": valeur})
        data = r.get_json()
        assert (data["pages"], data["page"], len(data["items"])) == (2, 2, 1)
        assert data["items"][0]["id"] == max(un_a.id, deux_a.id)
        r = client.get('/api/users/annuaire?promo=21', headers={"X-API-Key": valeur})
        assert [u["nom_utilisateur"] for u in r.get_json()["items"]] == ["21deuxA"]
        r = client.get(f'/api/users/annuaire?depuis_id={min(un_a.id, deux_a.id)}', headers={"X-API-Key": valeur})
        assert [u["id"] for u in r.get_json()["items"]] == [max(un_a.id, deux_a.id)]
