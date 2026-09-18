import uuid
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
    id: uuid.UUID
    email: EmailStr
    name: str
    role: str
    locale: str
    interests: list[str]
    consent_analytics: bool

class UserUpdateIn(BaseModel):
    name: str | None = None
    locale: str | None = None
    interests: list[str] | None = None
    consent_analytics: bool | None = None

class PasswordUpdateIn(BaseModel):
    current_password: str
    new_password: str


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

class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content_id: int | None
    useful: bool
    note: str
    created_at: datetime

class AdminFeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content_id: int | None
    useful: bool
    note: str
    created_at: datetime
    learner_name: str
    learner_email: str

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
    actor_id: uuid.UUID | None
    action: str
    target_type: str
    target_id: int
    timestamp: datetime


class SkillGapAnalyticsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    skill_id: int
    skill_name: str
    average_gap: float

class ContentAnalyticsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    status: str
    count: int

class FeedbackAnalyticsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    total_feedback: int
    useful_feedback: int
    usefulness_percentage: float | None

class LearningPlanAnalyticsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    active_plan_count: int
    average_progress: float | None

class EvidenceIn(BaseModel):
    skill_id: int
    content_id: int | None = None
    url: HttpUrl
    description: str = Field(min_length=1, max_length=2000)

class EvidenceVerifyIn(BaseModel):
    status: str = Field(pattern="^(verified|rejected)$")
    verified_level: float | None = Field(default=None, ge=0, le=5)

class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: uuid.UUID
    skill_id: int
    content_id: int | None
    url: str
    description: str
    status: str
    verifier_id: uuid.UUID | None
    verified_at: datetime | None
    created_at: datetime

