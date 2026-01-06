import pytest
from app.models import Utilisateur

class TestUtilisateurs:
    def test_ajout_utilisateur(app, db_with_admin, client_factory_admin):
        with client_factory_admin() as admin:
            r = admin.post('/api/users/add_utilisateur', 
                       json={
                           "nom_utilisateur": "test",
                           "email": "test@example.com",
                           "nom": "Test",
                           "prenom": "Test",
                           "cycle": "ic",
                           "promotion": "23",
                           "mot_de_passe_en_clair": "1234"
                       })
            assert r.status_code == 203