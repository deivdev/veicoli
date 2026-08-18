from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class FamilyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class FamilyUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=80)


class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str | None
    created_at: datetime


class FamilyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    created_at: datetime
    members: list[MemberOut] = []


class InviteCreate(BaseModel):
    expires_in_days: int = Field(default=7, ge=1, le=90)


class InviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    expires_at: datetime
    created_at: datetime
    used_at: datetime | None = None


class JoinRequest(BaseModel):
    """Riscatto di un invito da parte di un utente già registrato."""

    code: str = Field(min_length=1, max_length=32)


class InvitePreview(BaseModel):
    """Info pubbliche mostrate in pagina di registrazione, senza autenticazione."""

    family_name: str
    valid: bool
