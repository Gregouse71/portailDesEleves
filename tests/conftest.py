import pytest

from app import create_app, db
from app.models import Utilisateur, Sondage, GlobalVariable
from config import Config

@pytest.fixture()
def app(scope="function"):
    config_test = Config()
    config_test.SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    _, app = create_app(config_test)
    with app.app_context():
        yield app

@pytest.fixture()
def db_initialized(app):
    db.create_all()
    yield db
    # Cleanup
    db.session.remove()
    db.drop_all()

@pytest.fixture()
def db_with_admin(app, db_initialized):
    admin = Utilisateur(nom_utilisateur="admin", prenom="Admin", nom="Nom", promotion=23, email="admin@example.com", cycle="de", mot_de_passe_en_clair="1234")
    admin.est_superutilisateur = True
    admin.est_baptise = True
    db_initialized.session.add(admin)
    db_initialized.session.commit()
    yield db_initialized
    db_initialized.session.remove()

@pytest.fixture()
def db_with_users(app, db_initialized):
    # 5 utilisateurs, arbitraire en utilisant du code précédent
    admin = Utilisateur(nom_utilisateur="admin", prenom="Admin", nom="Nom", promotion=23, email="admin@example.com", cycle="de", mot_de_passe_en_clair="1234")
    admin.est_superutilisateur = True
    admin.est_baptise = True
    jules = Utilisateur(nom_utilisateur="23imbert", prenom="Jules", nom="Imbert", promotion=23, email="jules@exemple.com", cycle="ic", mot_de_passe_en_clair="1234")
    achille = Utilisateur(nom_utilisateur="23fruchard", prenom="Achille", nom="Fruchard", promotion=23, email="achille@exemple.com", cycle="ic", mot_de_passe_en_clair="1234")
    louise = Utilisateur(nom_utilisateur="24deferran", prenom="Louise", nom="De Ferran", promotion=24, email="louise@exemple.com", cycle="ic", mot_de_passe_en_clair="1234")
    test_user = Utilisateur(nom_utilisateur="test", prenom="Test", nom="User", promotion=23, email="test@example.com", cycle="ic", mot_de_passe_en_clair="1234")
    vp_sondaj = Utilisateur(nom_utilisateur="23sondaj", prenom="VP", nom="Sondaj", promotion=23, email="vp_sondaj@example.com", cycle="ic", mot_de_passe_en_clair="1234")
    users = [admin, jules, achille, louise, test_user, vp_sondaj]

    for user in users:
        db_initialized.session.add(user)

    db_initialized.session.commit()
    yield db_initialized, users
    db_initialized.session.remove()

@pytest.fixture()
def db_sondages_with_users(app, db_with_users):
    var = GlobalVariable(key="id_sondage_du_jour", value=None)
    db_only, users = db_with_users
    db_only.session.add(var)
    db_only.session.commit()
    yield db_only, users

@pytest.fixture()
def db_sondages_full(app, db_sondages_with_users, client_factory_admin):
    db_only, users = db_sondages_with_users
    with client_factory_admin() as client_admin:
        r = client_admin.post('/api/sondages/proposer_sondage', json={'question':'test_question', 'reponses':['reponse_test_1', 'reponse_test_2']})
        assert r.status_code == 201
    yield db_only, users

@pytest.fixture()
def db_sondages_with_previous_sondages(app, db_sondages_with_users, client_factory_admin, client_factory_user_win, client_factory_user_lose):
    for i in range(3):
        question_name = f'test_question_{i}'
        with client_factory_admin() as client_admin:
            if i != 2: # 2 est arbitraire, c'est juste pour tester les victoires/défaites sur les deux index de reponses
                r = client_admin.post('/api/sondages/proposer_sondage', json={'question': question_name, 'reponses':['reponse_victoire', 'reponse_defaite']})
            else:
                r = client_admin.post('/api/sondages/proposer_sondage', json={'question': question_name, 'reponses':['reponse_defaite', 'reponse_victoire']})
            assert r.status_code == 201
            sondage_suivant_query = Sondage.query.filter_by(question=question_name)
            sondage = sondage_suivant_query.first()
            assert sondage
            r = client_admin.post(f'/api/sondages/route_valider_sondage/{sondage.id}')
            assert r.status_code == 200
            r = client_admin.post('/api/sondages/sondage_suivant')
            assert r.status_code == 200
            r = client_admin.get('/api/sondages/sondage_du_jour')
            assert r.json['is_sondage']
        def vote_sondage_full_users(id_victoire:int):
            with client_factory_admin() as client_admin:
                r = client_admin.post(f'/api/sondages/voter_sondage/{id_victoire}')
                assert r.status_code == 200
            id_defaite = (id_victoire + 1) % 2
            with client_factory_user_win() as client_user_win:
                r = client_user_win.post(f'/api/sondages/voter_sondage/{id_victoire}')
                assert r.status_code == 200
            with client_factory_user_lose() as client_user_lose:
                r = client_user_lose.post(f'/api/sondages/voter_sondage/{id_defaite}')
                assert r.status_code == 200
        if i != 2:
            vote_sondage_full_users(id_victoire=0)
        else:
            vote_sondage_full_users(id_victoire=1)
    with client_factory_admin() as client_admin:
        r = client_admin.post('/api/sondages/sondage_suivant')
        assert r.status_code == 200
        r = client_admin.get('/api/sondages/sondage_du_jour')
        assert not r.json['is_sondage']
    yield db_sondages_full
            

@pytest.fixture()
def client_factory(app):
    def _create_client():
        return app.test_client()
    return _create_client

@pytest.fixture()
def client_factory_admin(client_factory):
    def _create_client_admin():
        admin = client_factory()
        response = admin.post('/api/login/connexion', json={'username': 'admin', 'password': '1234'})
        assert response.status_code == 200
        return admin
    return _create_client_admin

@pytest.fixture()
def client_factory_user_win(client_factory):
    def _create_client_user_win():
        user_win = client_factory()
        response = user_win.post('/api/login/connexion', json={'username': '23fruchard', 'password': '1234'})
        assert response.status_code == 200
        return user_win
    return _create_client_user_win

@pytest.fixture()
def client_factory_user_lose(client_factory):
    def _create_client_user_lose():
        user_lose = client_factory()
        response = user_lose.post('/api/login/connexion', json={'username': '23imbert', 'password': '1234'})
        assert response.status_code == 200
        return user_lose
    return _create_client_user_lose

@pytest.fixture()
def client_factory_vp_sondaj(client_factory):
    def _create_client_vp_sondaj():
        vp_sondaj = client_factory()
        response = vp_sondaj.post('/api/login/connexion', json={'username': 'vp_sondaj', 'password': '1234'})
        assert response.status_code == 200
        return vp_sondaj
    return _create_client_vp_sondaj
