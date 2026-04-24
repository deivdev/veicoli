from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import User, Vehicle
from app.schemas.vehicle import VehicleOut, VehicleWithStatus
from app.status_service import compute_status

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard", response_model=list[VehicleWithStatus])
def dashboard(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    vehicles = db.query(Vehicle).order_by(Vehicle.created_at.desc()).all()
    return [
        VehicleWithStatus(**VehicleOut.model_validate(v).model_dump(), status=compute_status(db, v.id))
        for v in vehicles
    ]
