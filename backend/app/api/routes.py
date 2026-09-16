from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..core.db import get_db
from ..core.security import verify_password, create_token, hash_password
from ..models import User, ContentItem, Source, Skill, Assessment, LearningPlan, Feedback, AuditLog
from ..schemas import LoginIn, TokenOut, UserOut, ContentOut, AssessmentIn, FeedbackIn, SourceOut, AdminContentOut, AuditLogOut, SkillGapAnalyticsOut, ContentAnalyticsOut, FeedbackAnalyticsOut, LearningPlanAnalyticsOut, UserUpdateIn, PasswordUpdateIn

from ..services.recommendations import stakeholder_feed, skill_gap_summary
from ..services.ingestion import ingest_source
from ..services.digests import build_digest
from .deps import current_user, admin_user

router = APIRouter(prefix="/api/v1")


@router.post("/auth/login", response_model=TokenOut)
async def login(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    
    email = None
    password = None
    
    if "application/x-www-form-urlencoded" in content_type:
        form = await request.form()
        email = form.get("username")
        password = form.get("password")
    elif "application/json" in content_type:
        try:
            json_data = await request.json()
            email = json_data.get("email") or json_data.get("username")
            password = json_data.get("password")
        except Exception:
            raise HTTPException(422, "Invalid JSON body")
            
    if not email or not password:
        raise HTTPException(422, "Email (username) and password are required")
        
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(401, "Incorrect email or password")
    return TokenOut(access_token=create_token(user.email, user.role))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user

@router.patch("/me", response_model=UserOut)
def update_me(body: UserUpdateIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    values = body.model_dump(exclude_unset=True)
    for k, v in values.items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

@router.post("/me/password")
def update_password(body: PasswordUpdateIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not verify_password(body.current_password, user.password_hash):
        raise HTTPException(401, "Incorrect current password")
    if len(body.new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"status": "success"}


@router.get("/feed", response_model=list[ContentOut])
def feed(limit: int = Query(30, ge=1, le=100), db: Session = Depends(get_db), user: User = Depends(current_user)):
    return stakeholder_feed(db, user, limit)


@router.get("/skills")
def skills(db: Session = Depends(get_db), _: User = Depends(current_user)):
    return db.scalars(select(Skill).order_by(Skill.category, Skill.name)).all()


@router.put("/assessments")
def assess(body: AssessmentIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not db.get(Skill, body.skill_id):
        raise HTTPException(404, "Skill not found")
    row = db.scalar(select(Assessment).where(Assessment.user_id == user.id, Assessment.skill_id == body.skill_id))
    values = body.model_dump(mode="json")
    if row:
        for key, value in values.items(): setattr(row, key, value)
    else:
        row = Assessment(user_id=user.id, **values); db.add(row)
    db.commit()
    return {"status": "saved"}


@router.get("/skill-gaps")
def gaps(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return skill_gap_summary(db, user.id)


@router.get("/learning-plans")
def plans(db: Session = Depends(get_db), user: User = Depends(current_user)):
    return db.scalars(select(LearningPlan).where(LearningPlan.user_id == user.id)).all()


@router.get("/digests/{cadence}")
def digest(cadence: str, db: Session = Depends(get_db), user: User = Depends(current_user)):
    try:
        return build_digest(db, user, cadence)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/feedback", status_code=201)
def feedback(body: FeedbackIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    db.add(Feedback(user_id=user.id, **body.model_dump())); db.commit()
    return {"status": "recorded"}


@router.get("/admin/sources", response_model=list[SourceOut])
def admin_sources(db: Session = Depends(get_db), _: User = Depends(admin_user)):
    return db.scalars(select(Source).order_by(Source.id)).all()


@router.get("/admin/content", response_model=list[AdminContentOut])
def admin_content(status: str | None = None, db: Session = Depends(get_db), _: User = Depends(admin_user)):
    query = select(ContentItem)
    if status:
        query = query.where(ContentItem.status == status)
    return db.scalars(query.order_by(ContentItem.ingested_at.desc())).all()


@router.post("/admin/sources/{source_id}/ingest")
def ingest(source_id: int, db: Session = Depends(get_db), user: User = Depends(admin_user)):
    source = db.get(Source, source_id)
    if not source: raise HTTPException(404, "Source not found")
    created = ingest_source(db, source)
    db.add(AuditLog(actor_id=user.id, action="ingest_source", target_type="source", target_id=source.id))
    db.commit()
    return {"created": created}


@router.patch("/admin/content/{content_id}/approve")
def approve(content_id: int, db: Session = Depends(get_db), user: User = Depends(admin_user)):
    item = db.get(ContentItem, content_id)
    if not item: raise HTTPException(404, "Content not found")
    item.status = "approved"
    db.add(AuditLog(actor_id=user.id, action="approve_content", target_type="content", target_id=item.id))
    db.commit()
    return {"status": "approved"}

@router.get('/admin/audit', response_model=list[AuditLogOut])
def admin_audit(db: Session = Depends(get_db), _: User = Depends(admin_user)):
    return db.scalars(select(AuditLog).order_by(AuditLog.timestamp.desc())).all()


from ..schemas import SkillGapAnalyticsOut, ContentAnalyticsOut, FeedbackAnalyticsOut, LearningPlanAnalyticsOut
from ..services.analytics import get_skill_gaps_analytics, get_content_analytics, get_feedback_analytics, get_learning_plans_analytics

@router.get('/analytics/skill-gaps', response_model=list[SkillGapAnalyticsOut])
def analytics_skill_gaps(db: Session = Depends(get_db), _: User = Depends(admin_user)):
    return get_skill_gaps_analytics(db)

@router.get('/analytics/content', response_model=list[ContentAnalyticsOut])
def analytics_content(db: Session = Depends(get_db), _: User = Depends(admin_user)):
    return get_content_analytics(db)

@router.get('/analytics/feedback', response_model=FeedbackAnalyticsOut)
def analytics_feedback(db: Session = Depends(get_db), _: User = Depends(admin_user)):
    return get_feedback_analytics(db)

@router.get('/analytics/learning-plans', response_model=LearningPlanAnalyticsOut)
def analytics_learning_plans(db: Session = Depends(get_db), _: User = Depends(admin_user)):
    return get_learning_plans_analytics(db)

