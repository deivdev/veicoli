"""Computes expiry status for vehicles from their event history."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import (
    Inspection,
    Insurance,
    OdometerReading,
    RoadTax,
    Service,
    TireChange,
)

SERVICE_INTERVAL_DAYS = 365
TIRES_LIFETIME_DAYS = 365 * 5


@dataclass
class Expiry:
    due_date: date | None
    days_until: int | None
    status: str  # ok | warning | critical | unknown
    last_amount_cents: int | None = None

    def as_dict(self) -> dict:
        return {
            "due_date": self.due_date,
            "days_until": self.days_until,
            "status": self.status,
            "last_amount_cents": self.last_amount_cents,
        }


def _classify(due: date | None, today: date) -> tuple[str, int | None]:
    if due is None:
        return "unknown", None
    days = (due - today).days
    if days <= 7:
        return "critical", days
    if days <= 30:
        return "warning", days
    return "ok", days


def _latest_by_expiry(db: Session, model, vehicle_id: int, expiry_col, amount_col=None):
    row = db.scalar(
        select(model)
        .where(model.vehicle_id == vehicle_id)
        .order_by(desc(expiry_col))
        .limit(1)
    )
    if row is None:
        return None, None
    amount = getattr(row, amount_col.key, None) if amount_col is not None else None
    return getattr(row, expiry_col.key), amount


def compute_status(db: Session, vehicle_id: int, today: date | None = None) -> dict:
    today = today or date.today()

    ins_due, ins_amount = _latest_by_expiry(
        db, Insurance, vehicle_id, Insurance.end_date, Insurance.amount_cents
    )
    insp_due, insp_amount = _latest_by_expiry(
        db, Inspection, vehicle_id, Inspection.expires_on, Inspection.amount_cents
    )
    tax_due, tax_amount = _latest_by_expiry(
        db, RoadTax, vehicle_id, RoadTax.expires_on, RoadTax.amount_cents
    )

    last_service = db.scalar(
        select(Service)
        .where(Service.vehicle_id == vehicle_id)
        .order_by(desc(Service.performed_on))
        .limit(1)
    )
    if last_service:
        svc_due = last_service.performed_on + timedelta(days=SERVICE_INTERVAL_DAYS)
        svc_amount = last_service.amount_cents
    else:
        svc_due, svc_amount = None, None

    last_tire = db.scalar(
        select(TireChange)
        .where(TireChange.vehicle_id == vehicle_id)
        .order_by(desc(TireChange.changed_on))
        .limit(1)
    )
    if last_tire:
        tire_due = last_tire.changed_on + timedelta(days=TIRES_LIFETIME_DAYS)
        tire_amount = last_tire.amount_cents
    else:
        tire_due, tire_amount = None, None

    last_odo = db.scalar(
        select(OdometerReading)
        .where(OdometerReading.vehicle_id == vehicle_id)
        .order_by(desc(OdometerReading.reading_date))
        .limit(1)
    )
    current_km = last_odo.km if last_odo else None

    def mk(due, amount):
        status_str, days = _classify(due, today)
        return Expiry(due_date=due, days_until=days, status=status_str, last_amount_cents=amount).as_dict()

    return {
        "vehicle_id": vehicle_id,
        "insurance": mk(ins_due, ins_amount),
        "inspection": mk(insp_due, insp_amount),
        "road_tax": mk(tax_due, tax_amount),
        "service": mk(svc_due, svc_amount),
        "tires": mk(tire_due, tire_amount),
        "current_km": current_km,
    }
