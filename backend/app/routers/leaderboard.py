from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.cache import get_leaderboard_cache, set_leaderboard_cache
import json

router = APIRouter(prefix="/api", tags=["leaderboard"])


def build_leaderboard(db: Session, season_year: Optional[int] = None, limit: int = 100) -> List[schemas.LeaderboardEntry]:
    query = db.query(models.User).filter(models.User.total_points > 0)

    users = query.order_by(models.User.total_points.desc()).limit(limit).all()
    entries = []
    for rank, user in enumerate(users, start=1):
        total_preds = db.query(func.count(models.Prediction.id)).filter(models.Prediction.user_id == user.id).scalar() or 0
        correct = db.query(func.count(models.Prediction.id)).filter(
            models.Prediction.user_id == user.id,
            models.Prediction.winner_points > 0,
        ).scalar() or 0
        accuracy = round((correct / total_preds * 100), 1) if total_preds > 0 else 0.0
        entries.append(schemas.LeaderboardEntry(
            rank=rank,
            user_id=user.id,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            total_points=user.total_points,
            win_streak=user.win_streak,
            prediction_streak=user.prediction_streak,
            predictions_made=total_preds,
            accuracy_pct=accuracy,
        ))
    return entries


@router.get("/leaderboard", response_model=schemas.LeaderboardResponse)
def get_leaderboard(
    season: Optional[int] = None,
    race_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    cache_key = f"leaderboard:{season}:{race_id}"
    cached = get_leaderboard_cache(cache_key)
    if cached:
        data = json.loads(cached)
        return {"entries": data["entries"], "total": data["total"]}

    entries = build_leaderboard(db, season_year=season)
    total = db.query(func.count(models.User.id)).scalar() or 0
    result = {"entries": [e.model_dump() for e in entries], "total": total}
    set_leaderboard_cache(cache_key, json.dumps(result))
    return {"entries": entries, "total": total}


@router.get("/leaderboard/me", response_model=schemas.MyRankResponse)
def get_my_rank(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    entries = build_leaderboard(db, limit=1000)
    my_rank = next((e for e in entries if e.user_id == current_user.id), None)
    if not my_rank:
        rank_num = len(entries) + 1
        nearby = entries[-5:] if len(entries) >= 5 else entries
        return {"rank": rank_num, "total_points": current_user.total_points, "nearby": nearby}

    rank_idx = my_rank.rank - 1
    start = max(0, rank_idx - 5)
    end = min(len(entries), rank_idx + 6)
    nearby = entries[start:end]
    return {"rank": my_rank.rank, "total_points": current_user.total_points, "nearby": nearby}


@router.get("/badges", response_model=List[schemas.BadgeOut])
def get_badges(db: Session = Depends(get_db)):
    return db.query(models.Badge).all()


@router.get("/stats/{user_id}", response_model=schemas.UserStatsOut)
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")

    total_preds = db.query(func.count(models.Prediction.id)).filter(models.Prediction.user_id == user_id).scalar() or 0
    correct_winners = db.query(func.count(models.Prediction.id)).filter(
        models.Prediction.user_id == user_id, models.Prediction.winner_points > 0
    ).scalar() or 0
    correct_poles = db.query(func.count(models.Prediction.id)).filter(
        models.Prediction.user_id == user_id, models.Prediction.pole_points > 0
    ).scalar() or 0
    accuracy = round((correct_winners / total_preds * 100), 1) if total_preds > 0 else 0.0

    user_badges = (
        db.query(models.UserBadge)
        .filter(models.UserBadge.user_id == user_id)
        .all()
    )

    return schemas.UserStatsOut(
        user_id=user.id,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        total_points=user.total_points,
        total_predictions=total_preds,
        correct_winners=correct_winners,
        correct_poles=correct_poles,
        accuracy_pct=accuracy,
        win_streak=user.win_streak,
        longest_streak=user.longest_streak,
        badges=user_badges,
    )
