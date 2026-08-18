"""Aggiornamento di un DB creato prima di famiglie/ownership.

Il caso reale: in produzione il DB ha lo schema vecchio e dei dati dentro.
All'avvio le migrazioni devono precedere ogni query ORM, altrimenti i modelli
chiedono colonne che non esistono ancora.
"""
import sqlite3

import pytest
from fastapi.testclient import TestClient

_OLD_SCHEMA = """
CREATE TABLE users (
  id INTEGER PRIMARY KEY, email VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL, name VARCHAR, created_at DATETIME NOT NULL);
CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY, plate VARCHAR NOT NULL, make VARCHAR NOT NULL,
  model VARCHAR NOT NULL, year INTEGER, vehicle_type VARCHAR NOT NULL DEFAULT 'car',
  fuel_type VARCHAR, vin VARCHAR, registration_date DATE, photo_path VARCHAR,
  notes VARCHAR, created_at DATETIME NOT NULL);
CREATE TABLE insurances (
  id INTEGER PRIMARY KEY, vehicle_id INTEGER NOT NULL, company VARCHAR,
  policy_number VARCHAR, start_date DATE NOT NULL, end_date DATE NOT NULL,
  amount_cents INTEGER, paid_on DATE, notes VARCHAR, created_at DATETIME NOT NULL);
"""

_EMAIL = "legacy@example.com"
_PASSWORD = "supersecret"


@pytest.fixture()
def legacy_db(tmp_path, monkeypatch):
    """Un DB con lo schema pre-famiglie e un utente con un veicolo."""
    from app.auth import hash_password

    path = tmp_path / "legacy.db"
    con = sqlite3.connect(path)
    con.executescript(_OLD_SCHEMA)
    con.execute(
        "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, 'Admin', '2026-01-01 00:00:00')",
        (_EMAIL, hash_password(_PASSWORD)),
    )
    con.execute(
        "INSERT INTO vehicles (plate, make, model, vehicle_type, created_at)"
        " VALUES ('AA000AA', 'Piaggio', 'Vespa', 'motorcycle', '2026-01-01 00:00:00')"
    )
    con.execute(
        "INSERT INTO insurances (vehicle_id, company, start_date, end_date, amount_cents, created_at)"
        " VALUES (1, 'Generali', '2024-05-21', '2027-02-04', 18500, '2026-01-01 00:00:00')"
    )
    con.commit()
    con.close()
    return path


def _boot(path, monkeypatch):
    """Avvia l'app contro `path`, come farebbe il container al restart.

    L'engine e la sessione sono creati all'import, quindi non basta cambiare
    DATABASE_URL: li ridirigiamo entrambi sul DB legacy.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    import app.db
    import app.main
    import app.seed
    from app.config import settings

    engine = create_engine(f"sqlite:///{path}", connect_args={"check_same_thread": False})
    session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    monkeypatch.setattr(app.db, "engine", engine)
    monkeypatch.setattr(app.db, "SessionLocal", session_local)
    monkeypatch.setattr(app.main, "engine", engine)
    monkeypatch.setattr(app.main, "SessionLocal", session_local)
    monkeypatch.setattr(settings, "admin_email", _EMAIL)
    monkeypatch.setattr(settings, "admin_password", _PASSWORD)

    # get_db risolve SessionLocal dal modulo app.db a ogni richiesta.
    return app.main.app


def _login(client):
    r = client.post("/api/auth/login", json={"email": _EMAIL, "password": _PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_legacy_db_boots_and_keeps_data(legacy_db, monkeypatch):
    app = _boot(legacy_db, monkeypatch)

    # Lo startup è il punto che regrediva: seed_admin prima di run_migrations
    # esplodeva con "no such column: users.family_id".
    with TestClient(app) as c:
        h = _login(c)

        vehicles = c.get("/api/vehicles", headers=h).json()
        assert [v["plate"] for v in vehicles] == ["AA000AA"]

        insurances = c.get(f"/api/vehicles/{vehicles[0]['id']}/insurances", headers=h).json()
        assert [i["amount_cents"] for i in insurances] == [18500]

        # Chi eredita i veicoli migrati deve poter invitare altri membri.
        me = c.get("/api/auth/me", headers=h).json()
        assert me["family_id"] is not None
        assert c.post("/api/family/invites", headers=h, json={"days": 7}).status_code == 201


def test_migrations_are_idempotent(legacy_db, monkeypatch):
    for _ in range(3):
        app = _boot(legacy_db, monkeypatch)
        with TestClient(app) as c:
            h = _login(c)
            assert len(c.get("/api/vehicles", headers=h).json()) == 1

    # Nessuna famiglia duplicata dopo tre avvii.
    con = sqlite3.connect(legacy_db)
    assert con.execute("SELECT COUNT(*) FROM families").fetchone()[0] == 1
    con.close()
