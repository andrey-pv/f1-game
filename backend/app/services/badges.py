import logging
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models

logger = logging.getLogger(__name__)

BADGE_DEFINITIONS = [
    {
        "slug": "pole_rookie",
        "name": "Pole Rookie",
        "description": "First correct pole position prediction.",
        "icon": "🏁",
    },
    {
        "slug": "winners_circle",
        "name": "Winner's Circle",
        "description": "First correct race winner prediction.",
        "icon": "🏆",
    },
    {
        "slug": "on_fire",
        "name": "On Fire",
        "description": "Correct race winner 3 races in a row.",
        "icon": "🔥",
    },
    {
        "slug": "lightning_rod",
        "name": "Lightning Rod",
        "description": "Correct pole sitter 3 races in a row.",
        "icon": "⚡",
    },
    {
        "slug": "double_down",
        "name": "Double Down",
        "description": "Correct winner AND pole in the same race weekend.",
        "icon": "🎯",
    },
    {
        "slug": "globe_trotter",
        "name": "Globe Trotter",
        "description": "Submit predictions for races on 3 different continents.",
        "icon": "🌍",
    },
    {
        "slug": "season_faithful",
        "name": "Season Faithful",
        "description": "Submit a prediction for every race in a full season.",
        "icon": "📅",
    },
    {
        "slug": "top_predictor",
        "name": "Top Predictor",
        "description": "Finish a full season ranked in the top 10 globally.",
        "icon": "🥇",
    },
    {
        "slug": "underdog_hunter",
        "name": "Underdog Hunter",
        "description": "Correctly predict a winner who started from grid position 5 or lower.",
        "icon": "🌶",
    },
    {
        "slug": "grand_master",
        "name": "Grand Master",
        "description": "Earn 1000 total points across all seasons.",
        "icon": "👑",
    },
]


def seed_badges(db: Session) -> None:
    for defn in BADGE_DEFINITIONS:
        existing = db.query(models.Badge).filter(models.Badge.slug == defn["slug"]).first()
        if not existing:
            badge = models.Badge(
                slug=defn["slug"],
                name=defn["name"],
                description=defn["description"],
                icon=defn["icon"],
                criteria_json="{}",
            )
            db.add(badge)
    db.commit()


def _award_badge(user_id: int, slug: str, db: Session) -> None:
    badge = db.query(models.Badge).filter(models.Badge.slug == slug).first()
    if not badge:
        return
    existing = db.query(models.UserBadge).filter(
        models.UserBadge.user_id == user_id,
        models.UserBadge.badge_id == badge.id,
    ).first()
    if not existing:
        user_badge = models.UserBadge(user_id=user_id, badge_id=badge.id)
        db.add(user_badge)
        logger.info(f"Awarded badge '{slug}' to user {user_id}")


def check_and_award_badges(user_id: int, db: Session) -> None:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return

    preds = db.query(models.Prediction).filter(
        models.Prediction.user_id == user_id,
        models.Prediction.is_locked == True,
    ).all()

    correct_winners = [p for p in preds if p.winner_points > 0]
    correct_poles = [p for p in preds if p.pole_points > 0]

    # Pole Rookie
    if correct_poles:
        _award_badge(user_id, "pole_rookie", db)

    # Winner's Circle
    if correct_winners:
        _award_badge(user_id, "winners_circle", db)

    # On Fire (3 win streak)
    if user.win_streak >= 3:
        _award_badge(user_id, "on_fire", db)

    # Double Down (correct winner and pole in same race)
    double_downs = [p for p in preds if p.winner_points > 0 and p.pole_points > 0]
    if double_downs:
        _award_badge(user_id, "double_down", db)

    # Grand Master (1000 points)
    if user.total_points >= 1000:
        _award_badge(user_id, "grand_master", db)

    # Check for Lightning Rod (3 consecutive correct poles)
    _check_lightning_rod(user_id, preds, db)

    # Check for Underdog Hunter
    _check_underdog_hunter(user_id, preds, db)

    db.flush()


def _check_lightning_rod(user_id: int, preds: list, db: Session) -> None:
    sorted_preds = sorted(preds, key=lambda p: p.race_id)
    streak = 0
    for p in sorted_preds:
        if p.pole_points > 0:
            streak += 1
            if streak >= 3:
                _award_badge(user_id, "lightning_rod", db)
                return
        else:
            streak = 0


def _check_underdog_hunter(user_id: int, preds: list, db: Session) -> None:
    for p in preds:
        if p.winner_points <= 0:
            continue
        # Check if the predicted winner started from grid pos >= 5
        result = db.query(models.RaceResult).filter(
            models.RaceResult.race_id == p.race_id,
            models.RaceResult.driver_id == p.predicted_winner_id,
        ).first()
        if result and result.grid is not None and result.grid >= 5:
            _award_badge(user_id, "underdog_hunter", db)
            return
