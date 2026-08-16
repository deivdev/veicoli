from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.config import settings
from app.db import get_db
from app.invites import consume, find_usable
from app.models import User
from app.schemas.auth import AuthConfigOut, TokenOut, UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/config", response_model=AuthConfigOut)
def auth_config():
    return AuthConfigOut(registration_enabled=settings.registration_enabled)


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    invite = None
    if payload.invite_code:
        invite = find_usable(db, payload.invite_code)
        if invite is None:
            raise HTTPException(status_code=400, detail="Invalid or expired invite code")
    elif not settings.registration_enabled:
        raise HTTPException(status_code=403, detail="Registration is disabled")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        family_id=invite.family_id if invite else None,
    )
    db.add(user)
    if invite is not None:
        db.flush()
        consume(db, invite, user.id)
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
