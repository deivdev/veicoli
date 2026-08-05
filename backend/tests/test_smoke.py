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
        "fuel-logs": {"filled_on": today, "milliliters": 40000, "amount_cents": 6800},
    }

    for ep, payload in entities.items():
        r = client.post(f"/api/vehicles/{vid}/{ep}", headers=h, json=payload)
        assert r.status_code == 201, f"{ep}: {r.text}"
        r = client.get(f"/api/vehicles/{vid}/{ep}", headers=h)
        assert r.status_code == 200
        assert len(r.json()) == 1


def test_fuel_price_per_liter_and_consumption(client):
    h = _auth(client)
    vid = client.post(
        "/api/vehicles",
        headers=h,
        json={"plate": "FU3LXX", "make": "Fiat", "model": "Punto"},
    ).json()["id"]

    # Prezzo/litro derivato: 50 L (50000 ml) per 80,00 € (8000 cent) -> 160 cent/L.
    r = client.post(
        "/api/vehicles/{}/fuel-logs".format(vid),
        headers=h,
        json={
            "filled_on": "2026-01-01",
            "km": 10000,
            "milliliters": 50000,
            "amount_cents": 8000,
            "is_full_tank": True,
        },
    )
    assert r.status_code == 201, r.text
    assert r.json()["price_per_liter_cents"] == 160

    # Secondo pieno: +500 km, 30 L bruciati -> 6 L/100km.
    r = client.post(
        "/api/vehicles/{}/fuel-logs".format(vid),
        headers=h,
        json={
            "filled_on": "2026-01-15",
            "km": 10500,
            "milliliters": 30000,
            "amount_cents": 4800,
            "is_full_tank": True,
        },
    )
    assert r.status_code == 201, r.text

    fuel = client.get(f"/api/vehicles/{vid}/status", headers=h).json()["fuel"]
    assert fuel["fillups_count"] == 2
    assert fuel["avg_l_per_100km"] == 6.0
    assert fuel["last_l_per_100km"] == 6.0
    assert fuel["total_amount_cents"] == 12800
    # Costo/km: solo segmenti chiusi -> 4800 cent / 500 km = 9.6 cent/km.
    assert fuel["cost_per_km_cents"] == 9.6
