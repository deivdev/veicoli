"""Create the admin user on first startup if ADMIN_EMAIL/PASSWORD are set."""
from sqlalchemy.orm import Session

from app.auth import hash_password
from app.config import settings
from app.models import User


def seed_admin(db: Session) -> None:
    if not settings.admin_email or not settings.admin_password:
        return
    existing = db.query(User).filter(User.email == settings.admin_email).first()
    if existing:
        return
    user = User(
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        name="Admin",
    )
    db.add(user)
    db.commit()
