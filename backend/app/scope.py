"""Regole di visibilità dei veicoli.

Un veicolo appartiene a un utente (`owner_id`). Un utente può appartenere a una
famiglia: in quel caso vede i veicoli di tutti i membri. Senza famiglia vede
solo i propri.
"""
from fastapi import HTTPException
from sqlalchemy.orm import Query, Session

from app.models import User, Vehicle


def owner_ids(db: Session, user: User) -> list[int]:
    if user.family_id is None:
        return [user.id]
    ids = [
        row[0]
        for row in db.query(User.id).filter(User.family_id == user.family_id).all()
    ]
    # L'utente corrente è sempre incluso, anche in caso di dati incoerenti.
    if user.id not in ids:
        ids.append(user.id)
    return ids


def visible_vehicles(db: Session, user: User) -> Query:
    return db.query(Vehicle).filter(Vehicle.owner_id.in_(owner_ids(db, user)))


def get_visible_vehicle(db: Session, user: User, vehicle_id: int) -> Vehicle:
    """Restituisce il veicolo o solleva 404.

    Volutamente 404 e non 403: un veicolo altrui non deve rivelare la propria
    esistenza.
    """
    vehicle = visible_vehicles(db, user).filter(Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle
