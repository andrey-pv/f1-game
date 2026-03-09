from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["predictions"])

LOCK_MINUTES_BEFORE_QUALIFYING = 15


def is_race_locked(race: models.Race) -> bool:
    if not race.qualifying_date:
        return race.status in ("racing", "completed")
    lock_time = race.qualifying_date - timedelta(minutes=LOCK_MINUTES_BEFORE_QUALIFYING)
    return datetime.utcnow() >= lock_time


@router.post("/predictions", response_model=schemas.PredictionOut)
def submit_prediction(
    body: schemas.PredictionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    race = db.query(models.Race).filter(models.Race.id == body.race_id).first()
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")

    if is_race_locked(race):
        raise HTTPException(status_code=400, detail="Predictions are locked for this race")

    # Verify drivers exist
    winner = db.query(models.Driver).filter(models.Driver.id == body.predicted_winner_id).first()
    pole = db.query(models.Driver).filter(models.Driver.id == body.predicted_pole_id).first()
    if not winner or not pole:
        raise HTTPException(status_code=404, detail="Driver not found")

    existing = (
        db.query(models.Prediction)
        .filter(models.Prediction.user_id == current_user.id, models.Prediction.race_id == body.race_id)
        .first()
    )

    if existing:
        if existing.is_locked:
            raise HTTPException(status_code=400, detail="Prediction is locked")
        existing.predicted_winner_id = body.predicted_winner_id
        existing.predicted_pole_id = body.predicted_pole_id
        existing.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        prediction = models.Prediction(
            user_id=current_user.id,
            race_id=body.race_id,
            predicted_winner_id=body.predicted_winner_id,
            predicted_pole_id=body.predicted_pole_id,
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)
        return prediction


@router.get("/predictions/history", response_model=List[schemas.PredictionOut])
def get_prediction_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Prediction)
        .options(
            joinedload(models.Prediction.predicted_winner).joinedload(models.Driver.current_team),
            joinedload(models.Prediction.predicted_pole).joinedload(models.Driver.current_team),
            joinedload(models.Prediction.race),
        )
        .filter(models.Prediction.user_id == current_user.id)
        .order_by(models.Prediction.submitted_at.desc())
        .all()
    )


@router.get("/predictions/{race_id}", response_model=schemas.PredictionOut)
def get_prediction(
    race_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    prediction = (
        db.query(models.Prediction)
        .options(
            joinedload(models.Prediction.predicted_winner).joinedload(models.Driver.current_team),
            joinedload(models.Prediction.predicted_pole).joinedload(models.Driver.current_team),
            joinedload(models.Prediction.race),
        )
        .filter(
            models.Prediction.user_id == current_user.id,
            models.Prediction.race_id == race_id,
        )
        .first()
    )
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction
