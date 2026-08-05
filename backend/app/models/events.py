from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


class _EventBase:
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now_utc, nullable=False
    )


class Insurance(_EventBase, Base):
    __tablename__ = "insurances"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company: Mapped[str] = mapped_column(String, nullable=False)
    policy_number: Mapped[str | None] = mapped_column(String, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    paid_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class Inspection(_EventBase, Base):
    __tablename__ = "inspections"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    performed_on: Mapped[date] = mapped_column(Date, nullable=False)
    expires_on: Mapped[date] = mapped_column(Date, nullable=False)
    amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class Service(_EventBase, Base):
    __tablename__ = "services"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    performed_on: Mapped[date] = mapped_column(Date, nullable=False)
    km_at_service: Mapped[int | None] = mapped_column(Integer, nullable=True)
    amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    location: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class RoadTax(_EventBase, Base):
    __tablename__ = "road_taxes"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    expires_on: Mapped[date] = mapped_column(Date, nullable=False)
    paid_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class TireChange(_EventBase, Base):
    __tablename__ = "tire_changes"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    changed_on: Mapped[date] = mapped_column(Date, nullable=False)
    km_at_change: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tire_type: Mapped[str | None] = mapped_column(String, nullable=True)
    brand: Mapped[str | None] = mapped_column(String, nullable=True)
    model: Mapped[str | None] = mapped_column(String, nullable=True)
    amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class TireRotation(_EventBase, Base):
    __tablename__ = "tire_rotations"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rotated_on: Mapped[date] = mapped_column(Date, nullable=False)
    km_at_rotation: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class OdometerReading(_EventBase, Base):
    __tablename__ = "odometer_readings"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reading_date: Mapped[date] = mapped_column(Date, nullable=False)
    km: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)


class FuelLog(_EventBase, Base):
    __tablename__ = "fuel_logs"
    vehicle_id: Mapped[int] = mapped_column(
        ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filled_on: Mapped[date] = mapped_column(Date, nullable=False)
    km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Litri memorizzati in millilitri (int) per evitare drift dei float.
    milliliters: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Pieno: serve per calcolare i consumi tra due rifornimenti completi.
    is_full_tank: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    station: Mapped[str | None] = mapped_column(String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
