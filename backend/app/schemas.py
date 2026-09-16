from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, HttpUrl, ConfigDict


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    name: str
    role: str
    locale: str


class ContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    abstract: str
    canonical_url: str
    topics: list[str]
    resource_type: str
    language: str
    licence: str
    published_at: datetime | None


class AssessmentIn(BaseModel):
    skill_id: int
    current_level: float = Field(ge=0, le=5)
    target_level: float = Field(ge=0, le=5)
    confidence: float = Field(default=0.5, ge=0, le=1)
    evidence_url: HttpUrl | None = None


class FeedbackIn(BaseModel):
    content_id: int | None = None
    useful: bool
    note: str = Field(default="", max_length=2000)

class SourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    institution_type: str
    jurisdiction: str
    homepage: str
    feed_url: str | None
    trust_tier: str
    active: bool

class AdminContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source_id: int
    canonical_url: str
    title: str
    resource_type: str
    language: str
    licence: str
    status: str
    published_at: datetime | None
    ingested_at: datetime

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    actor_id: int | None
    action: str
    target_type: str
    target_id: int
    timestamp: datetime

