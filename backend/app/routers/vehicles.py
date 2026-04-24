import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.config import settings
from app.db import get_db
from app.models import User, Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleOut, VehicleStatus, VehicleUpdate
from app.status_service import compute_status

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_PHOTO_SIZE = 5 * 1024 * 1024


@router.get("", response_model=list[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Vehicle).order_by(Vehicle.created_at.desc()).all()


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vehicle(
    vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    db.delete(vehicle)
    db.commit()


@router.post("/{vehicle_id}/photo", response_model=VehicleOut)
async def upload_photo(
    vehicle_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if file.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    content = await file.read()
    if len(content) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=413, detail="Photo too large (max 5MB)")

    uploads = Path(settings.uploads_dir)
    uploads.mkdir(parents=True, exist_ok=True)
    ext = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}[file.content_type]
    filename = f"vehicle_{vehicle_id}_{uuid.uuid4().hex}{ext}"
    (uploads / filename).write_bytes(content)

    if vehicle.photo_path:
        old = uploads / Path(vehicle.photo_path).name
        if old.exists():
            old.unlink(missing_ok=True)

    vehicle.photo_path = filename
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.get("/{vehicle_id}/status", response_model=VehicleStatus)
def vehicle_status(
    vehicle_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    vehicle = db.get(Vehicle, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return compute_status(db, vehicle_id)
