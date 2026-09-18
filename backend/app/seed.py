import json
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session
from .models import User, Source, Skill, ContentItem, Assessment, LearningPlan, Evidence
from .core.security import hash_password

def seed(db: Session):
    if db.scalar(select(User.id).limit(1)):
        return

    admin = User(email="admin@aspireos.example.com", password_hash=hash_password("ChangeMe123!"), name="AspireOS Admin", role="admin")
    
    learner1 = User(email="learner1@aspireos.example.com", password_hash=hash_password("ChangeMe123!"), name="Demo Learner One",
                role="learner", locale="en", interests=["digital-economy", "ai", "employability"])
    
    learner2 = User(email="learner2@aspireos.example.com", password_hash=hash_password("ChangeMe123!"), name="Demo Learner Two",
                role="learner", locale="en", interests=["data", "analytics", "business"])
    
    learner3 = User(email="learner3@aspireos.example.com", password_hash=hash_password("ChangeMe123!"), name="Demo Learner Three",
                role="learner", locale="en", interests=["leadership", "communication", "management"])
                
    db.add_all([admin, learner1, learner2, learner3]); db.flush()

    source_path = Path("/app/infra/sources.json")
    if not source_path.exists(): source_path = Path(__file__).parents[2] / "infra" / "sources.json"
    records = json.loads(source_path.read_text()) if source_path.exists() else []
    sources = []
    for record in records:
        source = Source(**record); db.add(source); sources.append(source)
    db.flush()

    skills = [
        Skill(code="DIG-LIT", name="Digital Literacy", category="Foundational", description="Safe and effective use of digital systems"),
        Skill(code="DATA-LIT", name="Data Literacy", category="Analytical", description="Interpret, question and communicate with data"),
        Skill(code="AI-LIT", name="AI Literacy", category="Emerging Technology", description="Use and govern AI responsibly"),
        Skill(code="CRI-THK", name="Critical Thinking", category="Cognitive", description="Evaluate evidence and competing claims"),
        Skill(code="COM-01", name="Professional Communication", category="Human", description="Communicate clearly across stakeholders"),
    ]
    db.add_all(skills); db.flush()
    
    content_items = []
    if sources:
        content1 = ContentItem(source_id=sources[0].id, canonical_url="https://www.worldbank.org/en/publication/wdr2021",
                           title="World Development Report 2021: Data for Better Lives",
                           abstract="A public institutional resource on the development value, governance and safeguards of data.",
                           topics=["data", "digital-economy", "governance"], stakeholder_roles=["learner", "faculty", "government", "institution"],
                           resource_type="report", licence="link-only", status="approved")
        db.add(content1); db.flush()
        content_items.append(content1)

    # Learner 1 data
    for skill, current, target in [(skills[0], 2.5, 4), (skills[3], 3.0, 4)]:
        db.add(Assessment(user_id=learner1.id, skill_id=skill.id, current_level=current, target_level=target, confidence=.75))
    db.add(LearningPlan(user_id=learner1.id, title="Critical Thinking & Digital Basics", milestones=[
        {"title": "Review digital best practices", "status": "done"},
        {"title": "Complete logic seminar", "status": "in_progress"},
        {"title": "Submit final essay", "status": "todo"}], progress=40))
    if content_items:
        db.add(Evidence(user_id=learner1.id, skill_id=skills[0].id, content_id=content_items[0].id, url="https://example.com/evidence1", description="Learner 1 Evidence", status="pending"))

    # Learner 2 data
    for skill, current, target in [(skills[1], 2, 4), (skills[2], 1.5, 4)]:
        db.add(Assessment(user_id=learner2.id, skill_id=skill.id, current_level=current, target_level=target, confidence=.5))
    db.add(LearningPlan(user_id=learner2.id, title="AI and Data Decision Readiness", milestones=[
        {"title": "Complete baseline assessment", "status": "done"},
        {"title": "Study responsible AI resources", "status": "in_progress"},
        {"title": "Submit evidence project", "status": "todo"}], progress=33))
    db.add(Evidence(user_id=learner2.id, skill_id=skills[1].id, content_id=None, url="https://example.com/evidence2", description="Learner 2 Data Analytics Certificate", status="pending"))

    # Learner 3 data
    for skill, current, target, verified in [(skills[4], 4.0, 5.0, 4.0)]:
        db.add(Assessment(user_id=learner3.id, skill_id=skill.id, current_level=current, target_level=target, verified_level=verified, confidence=.9))
    db.add(LearningPlan(user_id=learner3.id, title="Advanced Communication", milestones=[
        {"title": "Public speaking workshop", "status": "done"}], progress=100))
    db.add(Evidence(user_id=learner3.id, skill_id=skills[4].id, content_id=None, url="https://example.com/evidence3", description="Learner 3 Comm Badge", status="verified", verifier_id=admin.id))

    db.commit()
