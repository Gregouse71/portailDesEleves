import chess
from app.models.models_echecs import EchecsDefi, EchecsPartie, EchecsElo
from unittest.mock import patch, MagicMock


# Coup fictif retourné par le mock Stockfish à chaque appel de l'IA
_COUP_IA = chess.Move.from_uci('g8f6')

# Décorateurs communs à tous les tests IA :
#   1. os.path.exists → True  (Stockfish "trouvé")
#   2. _stockfish     → coup fictif (pas de vrai processus)
#   3. gevent.spawn   → no-op  (pas de greenlet en arrière-plan)
_IA_PATCHES = [
    patch('app.services.services_echecs.os.path.exists', return_value=True),
    patch('app.services.services_echecs._stockfish', return_value=_COUP_IA),
    patch('app.services.services_echecs.gevent.spawn'),
]


def _apply_ia_patches(fn):
    """Applique les trois patches IA sur une méthode de test."""
    for p in reversed(_IA_PATCHES):
        fn = p(fn)
    return fn


class TestEchecs:

    @_apply_ia_patches
    def test_creer_partie_ia(self, mock_spawn, mock_sf, mock_exists,
                             app, db_with_users, client_factory_user_win):
        """Lance une partie contre l'IA et vérifie l'état initial."""
        with client_factory_user_win() as client:
            response = client.post("/api/echecs/defis", json={"mode": "ia"})
            assert response.status_code == 201
            data = response.json
            assert "partie_id" in data

            partie_id = data["partie_id"]
            response2 = client.get(f"/api/echecs/parties/{partie_id}")
            assert response2.status_code == 200
            partie = response2.json
            assert partie["statut"] in ("en_cours", "echec")
            assert partie["mode"] == "ia"
            assert "plateau" in partie
            assert "trait" in partie

    @_apply_ia_patches
    def test_coups_legaux(self, mock_spawn, mock_sf, mock_exists,
                          app, db_with_users, client_factory_user_win):
        with client_factory_user_win() as client:
            with patch('app.services.services_echecs.random.random', return_value=0.1):
                # 0.1 < 0.5 → joueur blanc, IA noire
                r = client.post("/api/echecs/defis", json={"mode": "ia"})
            partie_id = r.json["partie_id"]

            r2 = client.get(f"/api/echecs/parties/{partie_id}/coups_legaux?case=52")
            assert r2.status_code == 200
            assert sorted(r2.json["coups"]) == sorted([44, 36])  # e3 et e4

    @_apply_ia_patches
    def test_jouer_coup_illegal(self, mock_spawn, mock_sf, mock_exists,
                                app, db_with_users, client_factory_user_win):
        """Un coup illégal doit retourner une erreur."""
        with client_factory_user_win() as client:
            with patch('app.services.services_echecs.random.random', return_value=0.1):
                # joueur blanc garanti
                r = client.post("/api/echecs/defis", json={"mode": "ia"})
            partie_id = r.json["partie_id"]

            partie = client.get(f"/api/echecs/parties/{partie_id}").json
            if partie["trait"] == "blanc":
                # Essayer de jouer de e2 vers e5 (illégal)
                r2 = client.put(f"/api/echecs/parties/{partie_id}",
                                json={"de": 52, "vers": 28})
                assert r2.status_code == 400
                assert "erreur" in r2.json

    @_apply_ia_patches
    def test_jouer_coup_legal(self, mock_spawn, mock_sf, mock_exists,
                              app, db_with_users, client_factory_user_win):
        """e2->e4 doit changer l'état de la partie."""
        with client_factory_user_win() as client:
            with patch('app.services.services_echecs.random.random', return_value=0.1):
                # joueur blanc garanti
                r = client.post("/api/echecs/defis", json={"mode": "ia"})
            partie_id = r.json["partie_id"]

            r2 = client.put(f"/api/echecs/parties/{partie_id}",
                            json={"de": 52, "vers": 36})
            assert r2.status_code == 200
            assert r2.json["dernier_coup"] == "e2e4"
            assert r2.json["plateau"]["36"]["piece"] == "P"

    @_apply_ia_patches
    def test_abandonner(self, mock_spawn, mock_sf, mock_exists,
                        app, db_with_users, client_factory_user_win):
        """Abandonner doit terminer la partie."""
        with client_factory_user_win() as client:
            r = client.post("/api/echecs/defis", json={"mode": "ia"})
            partie_id = r.json["partie_id"]

            r2 = client.post(f"/api/echecs/parties/{partie_id}/abandonner")
            assert r2.status_code == 200
            assert r2.json["statut"] == "mat"
            assert r2.json["gagnant"] in ("blanc", "noir")

    @_apply_ia_patches
    def test_elo_mis_a_jour_apres_partie(self, mock_spawn, mock_sf, mock_exists,
                                         app, db_with_users, client_factory_user_win):
        """L'ELO doit être mis à jour après une partie terminée."""
        with client_factory_user_win() as client:
            response_me = client.get("/api/login/current_user_id")
            user_id = response_me.json["id_utilisateur"]

            r = client.post("/api/echecs/defis", json={"mode": "ia"})
            partie_id = r.json["partie_id"]

            # Abandonner pour terminer rapidement
            client.post(f"/api/echecs/parties/{partie_id}/abandonner")

            with app.app_context():
                elo = EchecsElo.query.filter_by(utilisateur_id=user_id).first()
                assert elo is not None
                assert elo.nb_parties == 1
                assert elo.rating != 1500  # le rating a changé

    def test_defi_humain(self, app, db_with_users, client_factory_user_win, client_factory_user_lose):
        """Créer et accepter un défi humain doit créer une partie."""
        with client_factory_user_win() as client1:
            r = client1.post("/api/echecs/defis", json={"mode": "humain"})
            assert r.status_code == 201
            defi_id = r.json["defi_id"]

        with client_factory_user_lose() as client2:
            r2 = client2.post(f"/api/echecs/defis/{defi_id}/accepter")
            assert r2.status_code == 201
            assert "partie_id" in r2.json