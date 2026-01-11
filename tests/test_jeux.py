from app.models import Utilisateur


class TestJeux:
    def test_2048_game_flow(app, db_with_users, client_factory_user_win):
        """
        Test le flux complet d'une partie de 2048 gérée côté serveur
        """
        with client_factory_user_win() as client:
            # 1. Démarrer une nouvelle partie
            response = client.post("/api/jeux/partie", json={"jeu": "2048"})
            assert response.status_code == 200

            response2 = client.get("/api/jeux/partie/2048", json={"jeu": "2048"})
            assert response2.status_code == 200

            assert response.json == response2.json

            data = response.json

            assert "jeu" in data and data["jeu"] == "2048"
            assert "score" in data and data["score"] == 0
            # La grille doit être 4x4
            assert "etat" in data and "plateau" in data["etat"]
            plateau = data["etat"]["plateau"]
            assert len(plateau) == 4 and len(plateau) == 4
            non_zero_tiles = sum(1 for row in plateau for cell in row if cell != 0)
            assert non_zero_tiles == 2

            directions = ["haut", "bas", "droite", "gauche"]

            for direction in directions:
                response = client.put("/api/jeux/partie/2048", json={"coup": direction})
                assert response.status_code == 200

    def test_2048_invalid_move(app, db_with_users, client_factory_user_win):
        """
        Test d'un mouvement invalide
        """
        with client_factory_user_win() as client:
            response = client.post("/api/jeux/partie", json={"jeu": "2048"})
            response = client.get("/api/jeux/partie/2048")

            response2 = client.put("/api/jeux/partie/2048", json={"coup": "invalide"})
            assert response.json == response2.json
    
    def test_2048_synchronisation(app, db_with_users, client_factory_user_win):
        """
        Test d'un mouvement invalide
        """
        with client_factory_user_win() as client:
            response = client.post("/api/jeux/partie", json={"jeu": "2048"})
            response = client.get("/api/jeux/partie/2048")

            response2 = client.put("/api/jeux/partie/2048", json={"coup": "haut", "score": 30})
            assert response.json == response2.json

    def test_2048_persistence(app, db_with_users, client_factory_user_win):
        """
        Vérifie que le meilleur score est mis à jour en fin de partie ou après un mouvement
        """
        with client_factory_user_win() as client:
            # Récupérer l'ID utilisateur
            response_me = client.get("/api/login/current_user_id")
            user_id = response_me.json["id_utilisateur"]

            # Démarrer le jeu
            response = client.post("/api/jeux/partie", json={"jeu": "2048"})

            for _ in range(5):
                client.put("/api/jeux/partie/2048", json={"coup": "haut"})
                client.put("/api/jeux/partie/2048", json={"coup": "gauche"})

            response = client.put("/api/jeux/partie/2048", json={"coup": "bas"})
            assert response.status_code == 200
            current_game_score = response.json["score"]

            client.post("/api/jeux/partie", json={"jeu": "2048"})
            user = Utilisateur.query.filter_by(id=user_id).first()
            assert user.meilleur_score_2048 == current_game_score
