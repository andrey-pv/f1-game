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
BONUS_DOUBLE_HIT = 10
BONUS_WINNER_POLE_PODIUM = 5
BONUS_3_RACE_STREAK = 15
BONUS_5_RACE_STREAK = 30
BONUS_PERFECT_WEEKEND = 20
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

    # Check if pole sitter finished on podium (P1-P3)
    pole_podium_positions = set()
    if pole_id:
        podium = db.query(models.RaceResult).filter(
            models.RaceResult.race_id == race_id,
            models.RaceResult.driver_id == pole_id,
            models.RaceResult.position <= 3,
        ).first()
        if podium:
            pole_podium_positions.add(pole_id)

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

        # Double hit bonus
        if correct_winner and correct_pole:
            bonus_pts += BONUS_DOUBLE_HIT

        # Perfect weekend bonus (same as double hit but separate tracking)
        if correct_winner and correct_pole:
            bonus_pts += BONUS_PERFECT_WEEKEND

        # Winner + pole on podium bonus
        if correct_winner and pole_id in pole_podium_positions:
            bonus_pts += BONUS_WINNER_POLE_PODIUM

        # Early bird bonus
        if race and race.qualifying_date:
            from datetime import timedelta
            early_cutoff = race.qualifying_date - timedelta(hours=48)
            if prediction.submitted_at <= early_cutoff:
                bonus_pts += BONUS_EARLY_BIRD

        prediction.winner_points = winner_pts
        prediction.pole_points = pole_pts
        prediction.bonus_points = bonus_pts
        prediction.total_points_earned = winner_pts + pole_pts + bonus_pts

        # Update user points
        user = prediction.user
        user.total_points += prediction.total_points_earned

        # Update streaks
        _update_streaks(user, correct_winner, db, race_id)

        # Apply streak bonuses
        streak_bonus = _get_streak_bonus(user.win_streak)
        if correct_winner and streak_bonus > 0:
            prediction.bonus_points += streak_bonus
            prediction.total_points_earned += streak_bonus
            user.total_points += streak_bonus

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


def _get_streak_bonus(win_streak: int) -> int:
    if win_streak >= 5:
        return BONUS_5_RACE_STREAK
    elif win_streak >= 3:
        return BONUS_3_RACE_STREAK
    return 0


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
