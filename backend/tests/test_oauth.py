from app.models.models_oauth import OAuth2Client


def _creer_client_oauth(db, client_id, redirect_uri, require_baptise=None):
    client = OAuth2Client(
        client_id=client_id,
        client_secret="secret",
        client_id_issued_at=0,
        client_secret_expires_at=0,
    )
    meta = {
        "client_name": client_id,
        "client_uri": "https://exemple.rezal-mdm.com/",
        "grant_types": ["authorization_code"],
        "redirect_uris": [redirect_uri],
        "response_types": ["code"],
        "scope": "openid profile email",
        "token_endpoint_auth_method": "client_secret_basic",
    }
    if require_baptise is not None:
        meta["require_baptise"] = require_baptise
    client.set_client_metadata(meta)
    db.session.add(client)
    db.session.commit()
    return client


def test_authorize_refuse_non_baptise_par_defaut(app, db_with_users, client_factory_user):
    db, _ = db_with_users
    redirect_uri = "https://wiki.rezal-mdm.com/callback"
    _creer_client_oauth(db, "wikimines", redirect_uri)

    with client_factory_user() as client:
        r = client.get(
            "/api/oauth/authorize",
            query_string={
                "response_type": "code",
                "client_id": "wikimines",
                "redirect_uri": redirect_uri,
                "scope": "openid profile email",
            },
        )
        assert r.status_code == 404


def test_authorize_accepte_non_baptise_si_require_baptise_false(app, db_with_users, client_factory_user):
    db, _ = db_with_users
    redirect_uri = "https://piche-clicker.apps.rezal-mdm.com/api/auth/callback"
    _creer_client_oauth(db, "piche-clicker", redirect_uri, require_baptise=False)

    with client_factory_user() as client:
        r = client.get(
            "/api/oauth/authorize",
            query_string={
                "response_type": "code",
                "client_id": "piche-clicker",
                "redirect_uri": redirect_uri,
                "scope": "openid profile email",
            },
        )
        assert r.status_code == 302
        assert r.headers["Location"].startswith(f"{redirect_uri}?code=")


def test_authorize_accepte_baptise_sur_client_baptise(app, db_with_users, client_factory_admin):
    db, _ = db_with_users
    redirect_uri = "https://wiki.rezal-mdm.com/callback"
    _creer_client_oauth(db, "wikimines", redirect_uri, require_baptise=True)

    with client_factory_admin() as client:
        r = client.get(
            "/api/oauth/authorize",
            query_string={
                "response_type": "code",
                "client_id": "wikimines",
                "redirect_uri": redirect_uri,
                "scope": "openid profile email",
            },
        )
        assert r.status_code == 302
        assert r.headers["Location"].startswith(f"{redirect_uri}?code=")
