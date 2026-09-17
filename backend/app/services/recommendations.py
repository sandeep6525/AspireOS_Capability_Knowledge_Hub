from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import ContentItem, User, Assessment, LearningPlan, Evidence, Skill


def stakeholder_feed(db: Session, user: User, limit: int = 30):
    items = db.scalars(select(ContentItem).where(ContentItem.status == "approved").order_by(ContentItem.published_at.desc()).limit(200)).all()
    interests = set(user.interests or [])
    role = user.role

    def score(item):
        topic_overlap = len(interests.intersection(item.topics or []))
        role_match = 1 if role in (item.stakeholder_roles or []) else 0
        language_match = 1 if item.language in {user.locale, "en"} else 0
        return 3 * role_match + 2 * topic_overlap + language_match

    return sorted(items, key=score, reverse=True)[:limit]


def skill_gap_summary(db: Session, user_id: int):
    rows = db.scalars(select(Assessment).where(Assessment.user_id == user_id)).all()

    def calc_gap(a):
        effective_level = a.verified_level if a.verified_level is not None else a.current_level
        return round(max(0, a.target_level - effective_level), 2)

    return [{"skill": a.skill.name, "current": a.current_level, "target": a.target_level,
             "verified": a.verified_level, "effective": a.verified_level if a.verified_level is not None else a.current_level,
             "gap": calc_gap(a), "confidence": a.confidence}
            for a in sorted(rows, key=lambda x: calc_gap(x), reverse=True)]


import re

def calculate_relevance(skill: Skill, item: ContentItem) -> int:
    def get_tokens(text: str) -> set:
        if not text: return set()
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        stopwords = {'and', 'for', 'the', 'with', 'this', 'that', 'are', 'will', 'from', 'have', 'has', 'about', 'their', 'they', 'our', 'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'}
        return set(w for w in words if w not in stopwords)

    skill_text = f"{skill.name} {skill.category} {skill.description}"
    item_text = f"{item.title} {item.abstract} {' '.join(item.topics or [])} {item.resource_type}"

    skill_tokens = get_tokens(skill_text)
    item_tokens = get_tokens(item_text)

    return len(skill_tokens.intersection(item_tokens))


def generate_dynamic_learning_plan(db: Session, user: User):
    gaps = skill_gap_summary(db, user.id)

    plan = db.scalar(select(LearningPlan).where(LearningPlan.user_id == user.id))

    if not gaps:
        if plan:
            db.delete(plan)
            db.commit()
        return None

    active_gaps = [g for g in gaps if g["gap"] > 0]

    if not active_gaps:
        if not plan:
            plan = LearningPlan(user_id=user.id)
            db.add(plan)
        plan.title = "Maintenance & Growth Plan"
        plan.milestones = []
        plan.progress = 100
        db.commit()
        db.refresh(plan)
        return plan

    top_skills = [g["skill"] for g in active_gaps[:3]]
    title = " & ".join(top_skills) + " Development"

    milestones = []

    # We fetch approved content and sources once for efficiency
    recent_approved = db.scalars(select(ContentItem).where(ContentItem.status == "approved").order_by(ContentItem.published_at.desc()).limit(200)).all()
    all_skills = {s.name: s for s in db.scalars(select(Skill)).all()}

    for gap in active_gaps[:3]:  # Top 3 gaps max
        skill_name = gap["skill"]
        skill_obj = all_skills.get(skill_name)

        # 1. Recommended Resource
        matched_content = None
        if skill_obj:
            scored_items = []
            for item in recent_approved:
                score = calculate_relevance(skill_obj, item)
                if score > 0:
                    scored_items.append((score, item))

            if scored_items:
                scored_items.sort(key=lambda x: (x[0], x[1].published_at or x[1].ingested_at), reverse=True)
                matched_content = scored_items[0][1]

        if matched_content:
            milestones.append({
                "type": "resource",
                "skill": skill_name,
                "title": f"Review resource: {matched_content.title}",
                "resource_id": matched_content.id,
                "source": matched_content.source.name if matched_content.source else "AspireOS",
                "status": "not_started",
                "url": matched_content.canonical_url,
                "resource_type": matched_content.resource_type,
                "published_at": matched_content.published_at.isoformat() if matched_content.published_at else None
            })

        # 2. Evidence submission
        # We need to find if there is an evidence submission for this skill
        evidence = db.scalar(select(Evidence).join(Evidence.skill).where(Evidence.user_id == user.id, Skill.name == skill_name).order_by(Evidence.created_at.desc()))

        ev_status = "not_started"
        if evidence:
            ev_status = evidence.status # 'pending' or 'verified'

        milestones.append({
            "type": "evidence",
            "skill": skill_name,
            "title": f"Submit evidence for {skill_name}",
            "status": ev_status
        })

    if not milestones:
        progress = 0
    else:
        completed = sum(1 for m in milestones if m["status"] in ("verified", "done"))
        progress = round((completed / len(milestones)) * 100)

    if not plan:
        plan = LearningPlan(user_id=user.id)
        db.add(plan)

    plan.title = title
    plan.milestones = milestones
    plan.progress = progress
    db.commit()
    db.refresh(plan)

    return plan

