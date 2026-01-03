import pytest
from app.services.services_sondages import sondage_suivant
from app.models import Utilisateur, Sondage, VoteSondage
from app.services.services_global import get_global_var
from flask_login import current_user

class TestSondages:
    def test_service_proposer_sondage(app, db_sondages_full):
        assert Sondage.query.filter_by(question="test_question")
    
    def test_permissions_valider_sondage(app, db_sondages_full, client_factory_user_win, client_factory_admin):
        sondage = Sondage.query.first()
        def status_code_valider_sondage(client):
            return client.post(f'/api/sondages/route_valider_sondage/{sondage.id}').status_code
        with client_factory_user_win() as client_user_win:
            assert status_code_valider_sondage(client_user_win) == 403 #Forbidden
        with client_factory_admin() as client_admin:
            assert status_code_valider_sondage(client_admin) == 200
        # TODO: rajouter test avec un utilisateur VP sondaj

    def test_service_sondage_suivant(app, db_sondages_full, client_factory_admin):
        assert (get_global_var("id_sondage_du_jour") is None)
        sondage_suivant_query = Sondage.query.filter_by(question="test_question")
        assert sondage_suivant_query.first()
        sondage = sondage_suivant_query.first()
        with client_factory_admin() as client_admin:
            r = client_admin.post(f'/api/sondages/route_valider_sondage/{sondage.id}')
            assert r.status_code == 200
            r = client_admin.post(f'/api/sondages/sondage_suivant')
            assert r.status_code == 200
            assert get_global_var("id_sondage_du_jour")
            r = client_admin.get('/api/sondages/sondage_du_jour')
            assert r.json['is_sondage']
    
    def test_victoires_sondages(app, db_sondages_with_previous_sondages, client_factory_admin, client_factory_user_lose):
        def test_scores_client(client, is_gagnant: bool):
            user_id = client.get('/api/login/current_user_id').json["id_utilisateur"]
            votes = VoteSondage.query.filter_by(utilisateur_id=user_id).all()
            for vote in votes:
                assert (vote.gagnant if is_gagnant 
                        else not vote.gagnant)
                assert (not vote.perdant if is_gagnant 
                        else vote.perdant)
                
        with client_factory_admin() as client_admin:
            test_scores_client(client_admin, is_gagnant=True)
        with client_factory_user_lose() as client_user_lose:
           test_scores_client(client_user_lose, is_gagnant=False)