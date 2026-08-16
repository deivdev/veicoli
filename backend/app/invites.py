"""Generazione e validazione dei codici di invito."""
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import FamilyInvite

# Alfabeto senza caratteri ambigui (0/O, 1/I/L): i codici si dettano a voce.
_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
_CODE_LEN = 10


def generate_code(db: Session) -> str:
    for _ in range(10):
        code = "".join(secrets.choice(_ALPHABET) for _ in range(_CODE_LEN))
        if db.query(FamilyInvite).filter(FamilyInvite.code == code).first() is None:
            return code
    raise RuntimeError("Could not generate a unique invite code")


def create_invite(db: Session, family_id: int, created_by_id: int, days: int) -> FamilyInvite:
    invite = FamilyInvite(
        family_id=family_id,
        code=generate_code(db),
        created_by_id=created_by_id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=days),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return invite


def _as_utc(value: datetime | None) -> datetime | None:
    """SQLite restituisce datetime naive: li trattiamo come UTC."""
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def is_usable(invite: FamilyInvite) -> bool:
    if invite.used_at is not None or invite.revoked_at is not None:
        return False
    expires_at = _as_utc(invite.expires_at)
    return expires_at is not None and expires_at > datetime.now(timezone.utc)


def find_usable(db: Session, code: str) -> FamilyInvite | None:
    invite = (
        db.query(FamilyInvite)
        .filter(FamilyInvite.code == code.strip().upper())
        .first()
    )
    if invite is None or not is_usable(invite):
        return None
    return invite


def consume(db: Session, invite: FamilyInvite, user_id: int) -> None:
    invite.used_at = datetime.now(timezone.utc)
    invite.used_by_id = user_id
