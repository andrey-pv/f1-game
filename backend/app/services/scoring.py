import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app import models
from app.services.badges import check_and_award_badges
from app.services.cache import invalidate_leaderboard_cache

logger = logging.getLogger(__name__)

# Point values
POINTS_CORRECT_WINNER = 25
POINTS_CORRECT_POLE = 15
BONUS_EARLY_BIRD = 2


def calculate_and_award_points(race_id: int, db: Session) -> None:
    logger.info(f"Calculating points for race {race_id}")

    # Get P1 finisher
    winner_result = (
        db.query(models.RaceResult)
        .filter(models.RaceResult.race_id == race_id, models.RaceResult.position == 1)
        .first()
    )
    # Get P1 qualifier
    pole_result = (
        db.query(models.QualifyingResult)
        .filter(models.QualifyingResult.race_id == race_id, models.QualifyingResult.position == 1)
        .first()
    )

    if not winner_result and not pole_result:
        logger.warning(f"No race/qualifying results found for race {race_id}")
        return

    winner_id = winner_result.driver_id if winner_result else None
    pole_id = pole_result.driver_id if pole_result else None

    predictions = db.query(models.Prediction).filter(
        models.Prediction.race_id == race_id,
        models.Prediction.is_locked == True,
    ).all()

    race = db.query(models.Race).filter(models.Race.id == race_id).first()

    for prediction in predictions:
        winner_pts = 0
        pole_pts = 0
        bonus_pts = 0

        correct_winner = prediction.predicted_winner_id == winner_id
        correct_pole = prediction.predicted_pole_id == pole_id

        if correct_winner:
            winner_pts = POINTS_CORRECT_WINNER
        if correct_pole:
            pole_pts = POINTS_CORRECT_POLE

        # Early bird bonus
        if race and race.qualifying_date:
            from datetime import timedelta
            early_cutoff = race.qualifying_date - timedelta(hours=48)
            if prediction.submitted_at <= early_cutoff:
                bonus_pts += BONUS_EARLY_BIRD

        old_total = prediction.total_points_earned or 0
        prediction.winner_points = winner_pts
        prediction.pole_points = pole_pts
        prediction.bonus_points = bonus_pts
        prediction.total_points_earned = winner_pts + pole_pts + bonus_pts

        user = prediction.user
        user.total_points = (user.total_points or 0) - old_total + prediction.total_points_earned

        # Update streaks
        _update_streaks(user, correct_winner, db, race_id)

        db.flush()
        check_and_award_badges(user.id, db)

    # Snapshot leaderboard
    _snapshot_leaderboard(race_id, db)
    db.commit()
    invalidate_leaderboard_cache()
    logger.info(f"Points calculated for race {race_id}: {len(predictions)} predictions scored")


def _update_streaks(user: models.User, correct_winner: bool, db: Session, race_id: int) -> None:
    # Prediction streak — always increment since they submitted
    user.prediction_streak = (user.prediction_streak or 0) + 1

    # Win streak
    if correct_winner:
        user.win_streak = (user.win_streak or 0) + 1
        if user.win_streak > (user.longest_streak or 0):
            user.longest_streak = user.win_streak
        user.current_streak = user.win_streak
    else:
        user.win_streak = 0


def _snapshot_leaderboard(race_id: int, db: Session) -> None:
    from sqlalchemy import func
    users = db.query(models.User).order_by(models.User.total_points.desc()).all()
    for rank, user in enumerate(users, start=1):
        pts_this_race = (
            db.query(models.Prediction)
            .filter(models.Prediction.race_id == race_id, models.Prediction.user_id == user.id)
            .first()
        )
        pts = pts_this_race.total_points_earned if pts_this_race else 0

        existing = db.query(models.LeaderboardSnapshot).filter(
            models.LeaderboardSnapshot.race_id == race_id,
            models.LeaderboardSnapshot.user_id == user.id,
        ).first()
        if not existing:
            existing = models.LeaderboardSnapshot(race_id=race_id, user_id=user.id)
            db.add(existing)
        existing.points_this_race = pts
        existing.cumulative_points = user.total_points
        existing.cumulative_rank = rank
    db.flush()
