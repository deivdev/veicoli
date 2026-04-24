from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


VehicleType = Literal["car", "motorcycle", "other"]
FuelType = Literal["petrol", "diesel", "lpg", "methane", "electric", "hybrid"]


class VehicleBase(BaseModel):
    plate: str
    make: str
    model: str
    year: int | None = None
    vehicle_type: VehicleType = "car"
    fuel_type: FuelType | None = None
    vin: str | None = None
    registration_date: date | None = None
    notes: str | None = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    plate: str | None = None
    make: str | None = None
    model: str | None = None
    year: int | None = None
    vehicle_type: VehicleType | None = None
    fuel_type: FuelType | None = None
    vin: str | None = None
    registration_date: date | None = None
    notes: str | None = None


class VehicleOut(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    photo_path: str | None
    created_at: datetime


ExpiryStatus = Literal["ok", "warning", "critical", "unknown"]


class ExpiryInfo(BaseModel):
    due_date: date | None
    days_until: int | None
    status: ExpiryStatus
    last_amount_cents: int | None = None


class VehicleStatus(BaseModel):
    vehicle_id: int
    insurance: ExpiryInfo
    inspection: ExpiryInfo
    road_tax: ExpiryInfo
    service: ExpiryInfo
    tires: ExpiryInfo
    current_km: int | None = None


class VehicleWithStatus(VehicleOut):
    status: VehicleStatus
