"""Generic CRUD routers for the seven history entities."""
from typing import Type

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import (
    FuelLog,
    Inspection,
    Insurance,
    OdometerReading,
    RoadTax,
    Service,
    TireChange,
    TireRotation,
    User,
    Vehicle,
)
from app.schemas.events import (
    FuelLogIn,
    FuelLogOut,
    InspectionIn,
    InspectionOut,
    InsuranceIn,
    InsuranceOut,
    OdometerIn,
    OdometerOut,
    RoadTaxIn,
    RoadTaxOut,
    ServiceIn,
    ServiceOut,
    TireChangeIn,
    TireChangeOut,
    TireRotationIn,
    TireRotationOut,
)


def _build_router(
    *,
    path_segment: str,
    tag: str,
    model: Type,
    in_schema: Type[BaseModel],
    out_schema: Type[BaseModel],
    order_col,
) -> APIRouter:
    r = APIRouter(tags=[tag])

    @r.get(f"/vehicles/{{vehicle_id}}/{path_segment}", response_model=list[out_schema])
    def list_items(
        vehicle_id: int,
        db: Session = Depends(get_db),
        _: User = Depends(get_current_user),
    ):
        if db.get(Vehicle, vehicle_id) is None:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        return (
            db.query(model)
            .filter(model.vehicle_id == vehicle_id)
            .order_by(desc(order_col))
            .all()
        )

    @r.post(
        f"/vehicles/{{vehicle_id}}/{path_segment}",
        response_model=out_schema,
        status_code=status.HTTP_201_CREATED,
    )
    def create_item(
        vehicle_id: int,
        payload: in_schema,  # type: ignore[valid-type]
        db: Session = Depends(get_db),
        _: User = Depends(get_current_user),
    ):
        if db.get(Vehicle, vehicle_id) is None:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        item = model(vehicle_id=vehicle_id, **payload.model_dump())
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    @r.patch(f"/{path_segment}/{{item_id}}", response_model=out_schema)
    def update_item(
        item_id: int,
        payload: in_schema,  # type: ignore[valid-type]
        db: Session = Depends(get_db),
        _: User = Depends(get_current_user),
    ):
        item = db.get(model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(item, key, value)
        db.commit()
        db.refresh(item)
        return item

    @r.delete(f"/{path_segment}/{{item_id}}", status_code=status.HTTP_204_NO_CONTENT)
    def delete_item(
        item_id: int,
        db: Session = Depends(get_db),
        _: User = Depends(get_current_user),
    ):
        item = db.get(model, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="Not found")
        db.delete(item)
        db.commit()

    return r


routers = [
    _build_router(
        path_segment="insurances",
        tag="insurances",
        model=Insurance,
        in_schema=InsuranceIn,
        out_schema=InsuranceOut,
        order_col=Insurance.end_date,
    ),
    _build_router(
        path_segment="inspections",
        tag="inspections",
        model=Inspection,
        in_schema=InspectionIn,
        out_schema=InspectionOut,
        order_col=Inspection.expires_on,
    ),
    _build_router(
        path_segment="services",
        tag="services",
        model=Service,
        in_schema=ServiceIn,
        out_schema=ServiceOut,
        order_col=Service.performed_on,
    ),
    _build_router(
        path_segment="road-taxes",
        tag="road_taxes",
        model=RoadTax,
        in_schema=RoadTaxIn,
        out_schema=RoadTaxOut,
        order_col=RoadTax.expires_on,
    ),
    _build_router(
        path_segment="tire-changes",
        tag="tire_changes",
        model=TireChange,
        in_schema=TireChangeIn,
        out_schema=TireChangeOut,
        order_col=TireChange.changed_on,
    ),
    _build_router(
        path_segment="tire-rotations",
        tag="tire_rotations",
        model=TireRotation,
        in_schema=TireRotationIn,
        out_schema=TireRotationOut,
        order_col=TireRotation.rotated_on,
    ),
    _build_router(
        path_segment="odometer",
        tag="odometer",
        model=OdometerReading,
        in_schema=OdometerIn,
        out_schema=OdometerOut,
        order_col=OdometerReading.reading_date,
    ),
    _build_router(
        path_segment="fuel-logs",
        tag="fuel_logs",
        model=FuelLog,
        in_schema=FuelLogIn,
        out_schema=FuelLogOut,
        order_col=FuelLog.filled_on,
    ),
]
