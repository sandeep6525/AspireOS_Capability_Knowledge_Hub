from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.redis import RedisJobStore
from .core.config import get_settings
from .core.db import Base, engine, SessionLocal
from .api.routes import router
from .seed import seed
from .models import User
from .services.digests import build_digest


def process_digests(cadence: str):
    with SessionLocal() as db:
        users = db.query(User).all()
        for u in users:
            try:
                # In a real app this would send an email/notification
                # We just generate it to ensure the pipeline works and cache/save it if needed
                build_digest(db, u, cadence)
            except Exception as e:
                print(f"Error building {cadence} digest for {u.email}: {e}")


scheduler = AsyncIOScheduler(
    jobstores={'default': RedisJobStore(host='redis', port=6379, db=0)}
)

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db: seed(db)

    # Configure and start scheduler
    scheduler.add_job(process_digests, 'cron', hour=6, minute=30, args=['daily'], id='daily_digest_job', replace_existing=True)
    scheduler.add_job(process_digests, 'cron', day_of_week='mon', hour=7, minute=0, args=['weekly'], id='weekly_digest_job', replace_existing=True)
    scheduler.add_job(process_digests, 'cron', day=1, hour=8, minute=0, args=['monthly'], id='monthly_digest_job', replace_existing=True)

    scheduler.start()

    yield
    scheduler.shutdown()


app = FastAPI(title="AspireOS Capability & Knowledge Hub API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=get_settings().cors_list, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router)


@app.get("/health")
def health():
    return {"status": "healthy", "service": "aspireos-capability-hub"}

