"""Computes expiry status for vehicles from their event history."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models import (
    FuelLog,
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


def compute_fuel_stats(db: Session, vehicle_id: int) -> dict:
    """Consumi col metodo full-to-full.

    Tra due pieni consecutivi: litri (di tutti i rifornimenti dopo il primo
    pieno, fino al secondo incluso) / km percorsi. I parziali confluiscono nel
    segmento. Il primo pieno fa solo da baseline (non sappiamo i km prima).
    """
    logs = (
        db.query(FuelLog)
        .filter(FuelLog.vehicle_id == vehicle_id)
        .order_by(FuelLog.filled_on, FuelLog.id)
        .all()
    )

    total_ml = sum(log.milliliters for log in logs)
    total_cents = sum(log.amount_cents for log in logs if log.amount_cents is not None)

    base = {
        "fillups_count": len(logs),
        "total_amount_cents": total_cents or None,
        "total_milliliters": total_ml or None,
        "avg_l_per_100km": None,
        "avg_km_per_l": None,
        "cost_per_km_cents": None,
        "last_l_per_100km": None,
    }
    if not logs:
        return base

    # Solo rifornimenti con km noti contano per i consumi.
    with_km = [log for log in logs if log.km is not None]

    seg_km_total = 0           # km percorsi su segmenti chiusi full->full
    seg_ml_total = 0           # litri (ml) bruciati su quei segmenti
    seg_cost_total = 0         # spesa su quei segmenti
    last_seg_l_per_100km: float | None = None

    prev_full_idx: int | None = None
    pending_ml = 0             # litri accumulati dai parziali nel segmento corrente
    pending_cost = 0
    pending_cost_known = True

    for i, log in enumerate(with_km):
        if not log.is_full_tank:
            pending_ml += log.milliliters
            if log.amount_cents is None:
                pending_cost_known = False
            else:
                pending_cost += log.amount_cents
            continue

        # Pieno: chiude un segmento se avevamo già un pieno precedente.
        seg_ml = pending_ml + log.milliliters
        seg_cost = pending_cost + (log.amount_cents or 0)
        seg_cost_known = pending_cost_known and log.amount_cents is not None

        if prev_full_idx is not None:
            km = with_km[i].km - with_km[prev_full_idx].km
            if km > 0 and seg_ml > 0:
                seg_km_total += km
                seg_ml_total += seg_ml
                last_seg_l_per_100km = (seg_ml / 1000) / km * 100
                if seg_cost_known:
                    seg_cost_total += seg_cost

        prev_full_idx = i
        pending_ml = 0
        pending_cost = 0
        pending_cost_known = True

    if seg_km_total > 0 and seg_ml_total > 0:
        liters = seg_ml_total / 1000
        base["avg_l_per_100km"] = round(liters / seg_km_total * 100, 2)
        base["avg_km_per_l"] = round(seg_km_total / liters, 2)
        base["last_l_per_100km"] = round(last_seg_l_per_100km, 2)
        if seg_cost_total > 0:
            base["cost_per_km_cents"] = round(seg_cost_total / seg_km_total, 2)

    return base


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
        "fuel": compute_fuel_stats(db, vehicle_id),
    }
