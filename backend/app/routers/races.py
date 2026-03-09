from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api", tags=["races"])


@router.get("/races", response_model=List[schemas.RaceOut])
def get_races(season_year: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Race).join(models.Season)
    if season_year:
        query = query.filter(models.Season.year == season_year)
    else:
        query = query.filter(models.Season.is_current == True)
    return query.order_by(models.Race.round).all()


@router.get("/races/{race_id}", response_model=schemas.RaceDetailOut)
def get_race(race_id: int, db: Session = Depends(get_db)):
    race = (
        db.query(models.Race)
        .options(
            joinedload(models.Race.race_results).joinedload(models.RaceResult.driver).joinedload(models.Driver.current_team),
            joinedload(models.Race.race_results).joinedload(models.RaceResult.team),
            joinedload(models.Race.qualifying_results).joinedload(models.QualifyingResult.driver).joinedload(models.Driver.current_team),
            joinedload(models.Race.qualifying_results).joinedload(models.QualifyingResult.team),
        )
        .filter(models.Race.id == race_id)
        .first()
    )
    if not race:
        raise HTTPException(status_code=404, detail="Race not found")
    return race


@router.get("/drivers", response_model=List[schemas.DriverOut])
def get_drivers(db: Session = Depends(get_db)):
    return (
        db.query(models.Driver)
        .options(joinedload(models.Driver.current_team))
        .all()
    )


@router.get("/teams", response_model=List[schemas.TeamOut])
def get_teams(db: Session = Depends(get_db)):
    return db.query(models.Team).all()
