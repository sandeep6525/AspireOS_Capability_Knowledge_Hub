from sqlalchemy import func
from sqlalchemy.orm import Session
from ..models import Assessment, Skill, ContentItem, Feedback, LearningPlan

def get_skill_gaps_analytics(db: Session):
    # Calculate max(0, target - effective) where effective = coalesce(verified, current)
    effective_level = func.coalesce(Assessment.verified_level, Assessment.current_level)
    gap_expr = func.greatest(0, Assessment.target_level - effective_level)
    results = (
        db.query(
            Assessment.skill_id,
            Skill.name.label("skill_name"),
            func.avg(gap_expr).label("average_gap")
        )
        .join(Skill, Assessment.skill_id == Skill.id)
        .group_by(Assessment.skill_id, Skill.name)
        .order_by(func.avg(gap_expr).desc())
        .limit(5)
        .all()
    )
    return [
        {"skill_id": r.skill_id, "skill_name": r.skill_name, "average_gap": float(r.average_gap)}
        for r in results
    ]

def get_content_analytics(db: Session):
    results = (
        db.query(ContentItem.status, func.count(ContentItem.id).label("count"))
        .group_by(ContentItem.status)
        .all()
    )
    return [{"status": r.status, "count": r.count} for r in results]

def get_feedback_analytics(db: Session):
    total = db.query(func.count(Feedback.id)).scalar() or 0
    useful = db.query(func.count(Feedback.id)).filter(Feedback.useful == True).scalar() or 0
    percentage = (useful / total * 100) if total > 0 else None
    return {
        "total_feedback": total,
        "useful_feedback": useful,
        "usefulness_percentage": percentage
    }

def get_learning_plans_analytics(db: Session):
    # Active plans are status = 'active'
    active_plans = db.query(LearningPlan).filter(LearningPlan.status == 'active').all()
    count = len(active_plans)
    if count == 0:
        return {"active_plan_count": 0, "average_progress": None}
    
    avg_progress = sum(p.progress for p in active_plans) / count
    return {"active_plan_count": count, "average_progress": avg_progress}
