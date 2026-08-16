from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.invites import create_invite, find_usable
from app.models import Family, FamilyInvite, User
from app.schemas.family import (
    FamilyCreate,
    FamilyOut,
    FamilyUpdate,
    InviteCreate,
    InviteOut,
    InvitePreview,
    MemberOut,
)

router = APIRouter(prefix="/family", tags=["family"])


def _require_family(db: Session, me: User) -> Family:
    if me.family_id is None:
        raise HTTPException(status_code=404, detail="You are not in a family")
    family = db.get(Family, me.family_id)
    if family is None:
        raise HTTPException(status_code=404, detail="You are not in a family")
    return family


def _members(db: Session, family_id: int) -> list[User]:
    return (
        db.query(User)
        .filter(User.family_id == family_id)
        .order_by(User.created_at.asc())
        .all()
    )


def _family_out(db: Session, family: Family) -> FamilyOut:
    return FamilyOut(
        id=family.id,
        name=family.name,
        created_at=family.created_at,
        members=[MemberOut.model_validate(u) for u in _members(db, family.id)],
    )


@router.get("", response_model=FamilyOut)
def get_family(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    return _family_out(db, _require_family(db, me))


@router.post("", response_model=FamilyOut, status_code=status.HTTP_201_CREATED)
def create_family(
    payload: FamilyCreate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    if me.family_id is not None:
        raise HTTPException(status_code=409, detail="You already belong to a family")
    family = Family(name=payload.name)
    db.add(family)
    db.flush()
    me.family_id = family.id
    db.commit()
    db.refresh(family)
    return _family_out(db, family)


@router.patch("", response_model=FamilyOut)
def rename_family(
    payload: FamilyUpdate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    family = _require_family(db, me)
    family.name = payload.name
    db.commit()
    db.refresh(family)
    return _family_out(db, family)


@router.get("/invites", response_model=list[InviteOut])
def list_invites(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    family = _require_family(db, me)
    return (
        db.query(FamilyInvite)
        .filter(
            FamilyInvite.family_id == family.id,
            FamilyInvite.used_at.is_(None),
            FamilyInvite.revoked_at.is_(None),
            FamilyInvite.expires_at > datetime.now(timezone.utc),
        )
        .order_by(FamilyInvite.created_at.desc())
        .all()
    )


@router.post("/invites", response_model=InviteOut, status_code=status.HTTP_201_CREATED)
def new_invite(
    payload: InviteCreate,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    family = _require_family(db, me)
    return create_invite(db, family.id, me.id, payload.expires_in_days)


@router.delete("/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invite(
    invite_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    family = _require_family(db, me)
    invite = (
        db.query(FamilyInvite)
        .filter(FamilyInvite.id == invite_id, FamilyInvite.family_id == family.id)
        .first()
    )
    if invite is None:
        raise HTTPException(status_code=404, detail="Invite not found")
    invite.revoked_at = datetime.now(timezone.utc)
    db.commit()


@router.delete("/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    user_id: int,
    db: Session = Depends(get_db),
    me: User = Depends(get_current_user),
):
    """Rimuove un membro. I suoi veicoli restano suoi, ma escono dalla vista comune."""
    family = _require_family(db, me)
    if user_id == me.id:
        raise HTTPException(status_code=400, detail="Use /family/leave to remove yourself")
    member = db.get(User, user_id)
    if member is None or member.family_id != family.id:
        raise HTTPException(status_code=404, detail="Member not found")
    member.family_id = None
    db.commit()


@router.post("/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_family(db: Session = Depends(get_db), me: User = Depends(get_current_user)):
    family = _require_family(db, me)
    me.family_id = None
    db.flush()
    # Ultima persona uscita: la famiglia (e i suoi inviti) non serve più.
    if not _members(db, family.id):
        db.delete(family)
    db.commit()


@router.get("/invites/{code}/preview", response_model=InvitePreview)
def preview_invite(code: str, db: Session = Depends(get_db)):
    """Endpoint pubblico: la pagina di registrazione mostra il nome della famiglia."""
    invite = find_usable(db, code)
    if invite is None:
        return InvitePreview(family_name="", valid=False)
    family = db.get(Family, invite.family_id)
    if family is None:
        return InvitePreview(family_name="", valid=False)
    return InvitePreview(family_name=family.name, valid=True)
