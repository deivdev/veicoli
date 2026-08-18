"""Isolamento per proprietario, condivisione in famiglia, flusso inviti."""
import pytest


def _register(client, email, password="supersecret", invite_code=None):
    payload = {"email": email, "password": password, "name": email.split("@")[0]}
    if invite_code is not None:
        payload["invite_code"] = invite_code
    return client.post("/api/auth/register", json=payload)


def _auth(client, email):
    r = _register(client, email)
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _vehicle(client, headers, plate):
    r = client.post(
        "/api/vehicles",
        headers=headers,
        json={"plate": plate, "make": "Fiat", "model": "Panda"},
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def test_vehicles_are_isolated_between_users(client):
    alice = _auth(client, "alice@example.com")
    bob = _auth(client, "bob@example.com")

    vid = _vehicle(client, alice, "AA111AA")
    _vehicle(client, bob, "BB222BB")

    assert [v["plate"] for v in client.get("/api/vehicles", headers=alice).json()] == ["AA111AA"]
    assert [v["plate"] for v in client.get("/api/vehicles", headers=bob).json()] == ["BB222BB"]
    assert len(client.get("/api/dashboard", headers=bob).json()) == 1

    # Il veicolo altrui non esiste, non è "vietato".
    assert client.get(f"/api/vehicles/{vid}", headers=bob).status_code == 404
    assert client.patch(f"/api/vehicles/{vid}", headers=bob, json={"make": "X"}).status_code == 404
    assert client.delete(f"/api/vehicles/{vid}", headers=bob).status_code == 404
    assert client.get(f"/api/vehicles/{vid}/status", headers=bob).status_code == 404


def test_events_are_isolated_between_users(client):
    alice = _auth(client, "alice@example.com")
    bob = _auth(client, "bob@example.com")
    vid = _vehicle(client, alice, "AA111AA")

    item_id = client.post(
        f"/api/vehicles/{vid}/services",
        headers=alice,
        json={"performed_on": "2026-01-01"},
    ).json()["id"]

    assert client.get(f"/api/vehicles/{vid}/services", headers=bob).status_code == 404
    assert client.post(
        f"/api/vehicles/{vid}/services", headers=bob, json={"performed_on": "2026-01-02"}
    ).status_code == 404
    # Accesso diretto per id: non deve bastare conoscere il numero.
    assert client.patch(
        f"/api/services/{item_id}", headers=bob, json={"performed_on": "2026-02-01"}
    ).status_code == 404
    assert client.delete(f"/api/services/{item_id}", headers=bob).status_code == 404

    assert client.patch(
        f"/api/services/{item_id}", headers=alice, json={"performed_on": "2026-02-01"}
    ).status_code == 200


def test_family_invite_shares_vehicles(client):
    alice = _auth(client, "alice@example.com")
    vid = _vehicle(client, alice, "AA111AA")

    r = client.post("/api/family", headers=alice, json={"name": "Rossi"})
    assert r.status_code == 201, r.text
    assert r.json()["name"] == "Rossi"

    code = client.post("/api/family/invites", headers=alice, json={}).json()["code"]

    preview = client.get(f"/api/family/invites/{code}/preview").json()
    assert preview == {"family_name": "Rossi", "valid": True}

    r = _register(client, "bob@example.com", invite_code=code)
    assert r.status_code == 201, r.text
    bob = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # Bob vede il veicolo di Alice e può modificarlo.
    assert [v["id"] for v in client.get("/api/vehicles", headers=bob).json()] == [vid]
    assert client.patch(f"/api/vehicles/{vid}", headers=bob, json={"make": "VW"}).status_code == 200

    # E Alice vede quello di Bob.
    bob_vid = _vehicle(client, bob, "BB222BB")
    assert {v["id"] for v in client.get("/api/vehicles", headers=alice).json()} == {vid, bob_vid}

    members = client.get("/api/family", headers=alice).json()["members"]
    assert {m["email"] for m in members} == {"alice@example.com", "bob@example.com"}


def test_invite_is_single_use(client):
    alice = _auth(client, "alice@example.com")
    client.post("/api/family", headers=alice, json={"name": "Rossi"})
    code = client.post("/api/family/invites", headers=alice, json={}).json()["code"]

    assert _register(client, "bob@example.com", invite_code=code).status_code == 201
    r = _register(client, "carl@example.com", invite_code=code)
    assert r.status_code == 400
    assert "invite" in r.json()["detail"].lower()

    # Un invito consumato sparisce dalla lista dei pendenti.
    assert client.get("/api/family/invites", headers=alice).json() == []


def test_invalid_and_revoked_invites_are_rejected(client):
    alice = _auth(client, "alice@example.com")
    client.post("/api/family", headers=alice, json={"name": "Rossi"})
    invite = client.post("/api/family/invites", headers=alice, json={}).json()

    assert _register(client, "x@example.com", invite_code="NOPENOPE12").status_code == 400
    assert client.get("/api/family/invites/NOPENOPE12/preview").json()["valid"] is False

    assert client.delete(f"/api/family/invites/{invite['id']}", headers=alice).status_code == 204
    assert _register(client, "y@example.com", invite_code=invite["code"]).status_code == 400


def test_leaving_family_restores_isolation(client):
    alice = _auth(client, "alice@example.com")
    vid = _vehicle(client, alice, "AA111AA")
    client.post("/api/family", headers=alice, json={"name": "Rossi"})
    code = client.post("/api/family/invites", headers=alice, json={}).json()["code"]
    bob_token = _register(client, "bob@example.com", invite_code=code).json()["access_token"]
    bob = {"Authorization": f"Bearer {bob_token}"}
    bob_vid = _vehicle(client, bob, "BB222BB")

    assert client.post("/api/family/leave", headers=bob).status_code == 204

    assert [v["id"] for v in client.get("/api/vehicles", headers=bob).json()] == [bob_vid]
    assert [v["id"] for v in client.get("/api/vehicles", headers=alice).json()] == [vid]
    assert client.get(f"/api/vehicles/{vid}", headers=bob).status_code == 404
    assert client.get("/api/family", headers=bob).status_code == 404


def test_removing_a_member_revokes_shared_access(client):
    alice = _auth(client, "alice@example.com")
    vid = _vehicle(client, alice, "AA111AA")
    client.post("/api/family", headers=alice, json={"name": "Rossi"})
    code = client.post("/api/family/invites", headers=alice, json={}).json()["code"]
    bob_body = _register(client, "bob@example.com", invite_code=code).json()
    bob = {"Authorization": f"Bearer {bob_body['access_token']}"}
    bob_id = bob_body["user"]["id"]

    assert client.delete(f"/api/family/members/{bob_id}", headers=alice).status_code == 204
    assert client.get(f"/api/vehicles/{vid}", headers=bob).status_code == 404
    # I veicoli di Bob restano di Bob.
    assert client.get("/api/vehicles", headers=bob).json() == []

    assert client.delete(
        f"/api/family/members/{bob_id}", headers=alice
    ).status_code == 404


def test_family_endpoints_require_a_family(client):
    alice = _auth(client, "alice@example.com")
    assert client.get("/api/family", headers=alice).status_code == 404
    assert client.post("/api/family/invites", headers=alice, json={}).status_code == 404
    assert client.post("/api/family", headers=alice, json={"name": "A"}).status_code == 201
    assert client.post("/api/family", headers=alice, json={"name": "B"}).status_code == 409


@pytest.fixture()
def closed_registration(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "registration_enabled", False)


def test_invite_bypasses_disabled_registration(client, closed_registration):
    # Serve un utente esistente: lo creiamo prima di chiudere le registrazioni.
    from app.auth import hash_password
    from app.db import SessionLocal
    from app.models import User

    with SessionLocal() as db:
        alice = User(email="alice@example.com", password_hash=hash_password("supersecret"))
        db.add(alice)
        db.commit()

    token = client.post(
        "/api/auth/login",
        json={"email": "alice@example.com", "password": "supersecret"},
    ).json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}

    client.post("/api/family", headers=h, json={"name": "Rossi"})
    code = client.post("/api/family/invites", headers=h, json={}).json()["code"]

    assert client.get("/api/auth/config").json() == {"registration_enabled": False}
    assert _register(client, "nobody@example.com").status_code == 403
    assert _register(client, "bob@example.com", invite_code=code).status_code == 201


def test_existing_user_joins_with_invite_code(client):
    """Il caso di chi si registra prima di ricevere l'invito."""
    alice = _auth(client, "alice@example.com")
    vid = _vehicle(client, alice, "AA111AA")
    client.post("/api/family", headers=alice, json={"name": "Rossi"})

    # Bob esiste già e non è in nessuna famiglia.
    bob = _auth(client, "bob@example.com")
    assert client.get("/api/vehicles", headers=bob).json() == []

    code = client.post("/api/family/invites", headers=alice, json={}).json()["code"]
    r = client.post("/api/family/join", headers=bob, json={"code": code})
    assert r.status_code == 200, r.text
    assert r.json()["name"] == "Rossi"

    # Da qui in poi Bob vede i veicoli della famiglia.
    assert [v["id"] for v in client.get("/api/vehicles", headers=bob).json()] == [vid]
    members = client.get("/api/family", headers=alice).json()["members"]
    assert {m["email"] for m in members} == {"alice@example.com", "bob@example.com"}

    # L'invito è consumato: non vale per un terzo utente.
    carl = _auth(client, "carl@example.com")
    assert client.post("/api/family/join", headers=carl, json={"code": code}).status_code == 400


def test_join_is_rejected_when_already_in_a_family(client):
    alice = _auth(client, "alice@example.com")
    client.post("/api/family", headers=alice, json={"name": "Rossi"})

    bob = _auth(client, "bob@example.com")
    client.post("/api/family", headers=bob, json={"name": "Bianchi"})

    code = client.post("/api/family/invites", headers=alice, json={}).json()["code"]
    assert client.post("/api/family/join", headers=bob, json={"code": code}).status_code == 409

    # L'invito resta spendibile: il rifiuto non lo consuma.
    assert len(client.get("/api/family/invites", headers=alice).json()) == 1


def test_join_rejects_invalid_and_revoked_codes(client):
    alice = _auth(client, "alice@example.com")
    client.post("/api/family", headers=alice, json={"name": "Rossi"})
    bob = _auth(client, "bob@example.com")

    assert client.post("/api/family/join", headers=bob, json={"code": "NOPE123456"}).status_code == 400

    inv = client.post("/api/family/invites", headers=alice, json={}).json()
    client.delete(f"/api/family/invites/{inv['id']}", headers=alice)
    assert client.post("/api/family/join", headers=bob, json={"code": inv["code"]}).status_code == 400

    # Bob resta fuori da ogni famiglia.
    assert client.get("/api/auth/me", headers=bob).json()["family_id"] is None
