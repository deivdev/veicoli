from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class _OutBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int
    created_at: datetime


# Insurance
class InsuranceIn(BaseModel):
    company: str
    policy_number: str | None = None
    start_date: date
    end_date: date
    amount_cents: int | None = None
    paid_on: date | None = None
    notes: str | None = None


class InsuranceOut(_OutBase, InsuranceIn):
    pass


# Inspection
class InspectionIn(BaseModel):
    performed_on: date
    expires_on: date
    amount_cents: int | None = None
    location: str | None = None
    notes: str | None = None


class InspectionOut(_OutBase, InspectionIn):
    pass


# Service (tagliando)
class ServiceIn(BaseModel):
    performed_on: date
    km_at_service: int | None = None
    amount_cents: int | None = None
    location: str | None = None
    notes: str | None = None


class ServiceOut(_OutBase, ServiceIn):
    pass


# Road tax (bollo)
class RoadTaxIn(BaseModel):
    expires_on: date
    paid_on: date | None = None
    amount_cents: int | None = None
    notes: str | None = None


class RoadTaxOut(_OutBase, RoadTaxIn):
    pass


TireType = Literal["summer", "winter", "all_season"]


class TireChangeIn(BaseModel):
    changed_on: date
    km_at_change: int | None = None
    tire_type: TireType | None = None
    brand: str | None = None
    model: str | None = None
    amount_cents: int | None = None
    notes: str | None = None


class TireChangeOut(_OutBase, TireChangeIn):
    pass


class TireRotationIn(BaseModel):
    rotated_on: date
    km_at_rotation: int | None = None
    notes: str | None = None


class TireRotationOut(_OutBase, TireRotationIn):
    pass


class OdometerIn(BaseModel):
    reading_date: date
    km: int
    notes: str | None = None


class OdometerOut(_OutBase, OdometerIn):
    pass
