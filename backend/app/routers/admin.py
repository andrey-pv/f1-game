from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import require_admin
from app.services.f1_sync import DataSyncService
from app.services.scoring import calculate_and_award_points

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/sync")
def trigger_sync(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    service = DataSyncService(db)
    background_tasks.add_task(service.sync_all)
    return {"message": "F1 data sync started in background"}


@router.post("/sync/results/{race_id}")
def sync_race_results(
    race_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    race = db.query(models.Race).filter(models.Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")

    service = DataSyncService(db)
    background_tasks.add_task(service.fetch_race_results, race.round)
    return {"message": f"Race results sync started for race {race_id}"}


@router.post("/rescore/{race_id}")
def rescore_race(
    race_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    race = db.query(models.Race).filter(models.Race.id == race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    if race.status != "completed":
        raise HTTPException(status_code=400, detail="Race is not completed yet")

    calculate_and_award_points(race.id, db)
    return {"message": f"Race {race_id} rescored successfully"}
