import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import engine, Base
from app.routers import auth, races, predictions, leaderboard, admin
from app.services.badges import seed_badges
from app.database import SessionLocal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Seed badges
    db = SessionLocal()
    try:
        seed_badges(db)
    finally:
        db.close()

    # Start scheduler
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from apscheduler.triggers.cron import CronTrigger
        from app.services.f1_sync import DataSyncService

        scheduler = AsyncIOScheduler()

        def run_sync():
            db = SessionLocal()
            try:
                service = DataSyncService(db)
                service.sync_all()
            finally:
                db.close()

        # Run sync weekly on Monday at 2am UTC
        scheduler.add_job(run_sync, CronTrigger(day_of_week="mon", hour=2))
        # Also run at startup (after a delay) to ensure data is fresh
        scheduler.add_job(run_sync, "date")
        scheduler.start()
        logger.info("Scheduler started")
        yield
        scheduler.shutdown()
    except Exception as e:
        logger.warning(f"Scheduler failed to start: {e}")
        yield


app = FastAPI(
    title="F1 Predictor API",
    version="1.0.0",
    description="Full-Stack F1 Prediction & Gamification Platform",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(races.router)
app.include_router(predictions.router)
app.include_router(leaderboard.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
