from app.models import Association, Utilisateur
from app.models.modules.models_cotisations import AssociationCotisation, AssociationCotisationUtilisateur
from datetime import datetime, timedelta

class TestCotisations:
    def test_cotisation_creation_and_membership(app, db_initialized):
        # 1. Create association and user
        asso = Association(nom="TestAsso", ordre_importance=10, description="Test description")
        user = Utilisateur(nom_utilisateur="testuser", prenom="Test", nom="User", promotion=23, email="test@example.com", cycle="ic", mot_de_passe_en_clair="1234")
        db_initialized.session.add(asso)
        db_initialized.session.add(user)
        db_initialized.session.commit()

        # 2. Create cotisation
        today = datetime.now().date()
        cot = AssociationCotisation(
            nom="Cotisation Test",
            association=asso,
            date_debut=today,
            date_fin=today + timedelta(days=10)
        )
        db_initialized.session.add(cot)
        db_initialized.session.commit()

        # Check not cotisant initially
        assert not est_cotisant_asso(user, asso.id)

        # 3. Add user to cotisation
        link = AssociationCotisationUtilisateur(utilisateur_id=user.id, cotisation=cot)
        db_initialized.session.add(link)
        db_initialized.session.commit()

        # Check cotisant now
        assert est_cotisant_asso(user, asso.id)

        # 4. Check toggle
        # Toggling should remove the membership
        removed = user.toggle_cotisation_pour_association(asso.id)
        assert not removed  # removed means returned False for is_member after toggle
        assert not est_cotisant_asso(user, asso.id)

        # Toggling again should add it back
        added = user.toggle_cotisation_pour_association(asso.id)
        assert added
        assert est_cotisant_asso(user, asso.id)

    def test_cotisations_api(app, db_with_users, client_factory_admin):
        db_only, users = db_with_users
        admin_user = users[0]
        test_user = users[4]

        # Create association
        asso = Association(nom="Biero", ordre_importance=9, description="Bierologie")
        db_only.session.add(asso)
        db_only.session.commit()

        # Use admin client to create cotisation
        with client_factory_admin() as client_admin:
            today = datetime.now().date().isoformat()
            future = (datetime.now() + timedelta(days=365)).date().isoformat()

            # 1. Create cotisation
            r = client_admin.post(
                f'/api/cotisations/{asso.id}/cotisation',
                json={
                    "nom": "Cotisation Biero 2026",
                    "date_debut": today,
                    "date_fin": future
                }
            )
            assert r.status_code == 201
            cot_id = r.json["cotisation"]["id"]

            # 2. Get cotisations list
            r = client_admin.get(f'/api/cotisations/{asso.id}/cotisations')
            assert r.status_code == 200
            assert len(r.json) == 1
            assert r.json[0]["nom"] == "Cotisation Biero 2026"

            # 3. Add member
            r = client_admin.post(
                f'/api/cotisations/{asso.id}/cotisation/{cot_id}/membres',
                json={"utilisateur_id": test_user.id}
            )
            assert r.status_code == 201

            # Check that test_user is cotisant now
            assert test_est_cotisant_asso(user, asso.id)
            assert test_user.est_cotisant_biero

            # 4. Remove member
            r = client_admin.delete(f'/api/cotisations/{asso.id}/cotisation/{cot_id}/membres/{test_user.id}')
            assert r.status_code == 200

            # Check not cotisant
            assert not test_est_cotisant_asso(user, asso.id)
            assert not test_user.est_cotisant_biero
