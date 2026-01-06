# Tests des contrôleurs utilisateurs

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
    def test_permissions_ajout_utilisateur(app, db_with_users, client_factory_user_win):
        with client_factory_user_win() as user:
            r = user.post('/api/users/add_utilisateur', json=infos)
            assert r.status_code == 403
    def test_ajout_utilisateur(app, db_with_admin, client_factory_admin):
        with client_factory_admin() as admin:
            r = admin.post('/api/users/add_utilisateur', json=infos)
            assert r.status_code == 203