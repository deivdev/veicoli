from datetime import date, timedelta


def _auth(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "test@example.com", "password": "supersecret", "name": "T"},
    )
    assert r.status_code == 201, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_vehicle_and_insurance_flow(client):
    h = _auth(client)

    r = client.post(
        "/api/vehicles",
        headers=h,
        json={"plate": "AB123CD", "make": "Fiat", "model": "Panda", "vehicle_type": "car"},
    )
    assert r.status_code == 201, r.text
    vid = r.json()["id"]

    today = date.today()
    r = client.post(
        f"/api/vehicles/{vid}/insurances",
        headers=h,
        json={
            "company": "Unipol",
            "start_date": today.isoformat(),
            "end_date": (today + timedelta(days=5)).isoformat(),
            "amount_cents": 45000,
        },
    )
    assert r.status_code == 201, r.text

    r = client.get(f"/api/vehicles/{vid}/status", headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["insurance"]["status"] == "critical"
    assert body["insurance"]["days_until"] == 5

    r = client.get("/api/dashboard", headers=h)
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["status"]["insurance"]["status"] == "critical"


def test_all_entities_crud(client):
    h = _auth(client)
    vid = client.post(
        "/api/vehicles",
        headers=h,
        json={"plate": "XX000YY", "make": "VW", "model": "Golf"},
    ).json()["id"]
    today = date.today().isoformat()

    entities = {
        "inspections": {"performed_on": today, "expires_on": today},
        "services": {"performed_on": today},
        "road-taxes": {"expires_on": today},
        "tire-changes": {"changed_on": today},
        "tire-rotations": {"rotated_on": today},
        "odometer": {"reading_date": today, "km": 12345},
    }

    for ep, payload in entities.items():
        r = client.post(f"/api/vehicles/{vid}/{ep}", headers=h, json=payload)
        assert r.status_code == 201, f"{ep}: {r.text}"
        r = client.get(f"/api/vehicles/{vid}/{ep}", headers=h)
        assert r.status_code == 200
        assert len(r.json()) == 1
