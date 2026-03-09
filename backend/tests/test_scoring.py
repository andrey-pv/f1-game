import pytest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models
from app.services.scoring import calculate_and_award_points


def make_season(db):
    season = models.Season(year=2024, is_current=True)
    db.add(season)
    db.flush()
    return season


def make_race(db, season, round_num=1):
    race = models.Race(
        season_id=season.id,
        round=round_num,
        name="Test GP",
        status="completed",
        qualifying_date=datetime.utcnow() - timedelta(days=1),
        race_date=datetime.utcnow() - timedelta(hours=2),
    )
    db.add(race)
    db.flush()
    return race


def make_team(db, ref="ferrari"):
    team = models.Team(team_ref=ref, name="Ferrari", primary_color_hex="#E8001C")
    db.add(team)
    db.flush()
    return team


def make_driver(db, ref, team_id, code="VER"):
    driver = models.Driver(driver_ref=ref, code=code, forename="Max", surname="Test", current_team_id=team_id)
    db.add(driver)
    db.flush()
    return driver


def make_user(db, uid="user1"):
    user = models.User(google_uid=uid, email=f"{uid}@test.com", display_name="Test User")
    db.add(user)
    db.flush()
    return user


def make_prediction(db, user, race, winner_id, pole_id, locked=True):
    pred = models.Prediction(
        user_id=user.id,
        race_id=race.id,
        predicted_winner_id=winner_id,
        predicted_pole_id=pole_id,
        is_locked=locked,
        submitted_at=datetime.utcnow() - timedelta(days=3),
    )
    db.add(pred)
    db.flush()
    return pred


def make_race_result(db, race, driver, position, grid=1):
    result = models.RaceResult(
        race_id=race.id,
        driver_id=driver.id,
        position=position,
        grid=grid,
        status="Finished",
        points=25 if position == 1 else 0,
    )
    db.add(result)
    db.flush()
    return result


def make_qualifying_result(db, race, driver, position):
    result = models.QualifyingResult(
        race_id=race.id,
        driver_id=driver.id,
        position=position,
    )
    db.add(result)
    db.flush()
    return result


def test_correct_winner_points(db):
    season = make_season(db)
    race = make_race(db, season)
    team = make_team(db)
    winner = make_driver(db, "verstappen", team.id, "VER")
    other = make_driver(db, "hamilton", team.id, "HAM")
    user = make_user(db)

    make_race_result(db, race, winner, position=1, grid=1)
    make_race_result(db, race, other, position=2, grid=2)
    make_qualifying_result(db, race, other, position=1)  # different pole
    make_qualifying_result(db, race, winner, position=2)

    pred = make_prediction(db, user, race, winner_id=winner.id, pole_id=other.id)
    calculate_and_award_points(race.id, db)
    db.refresh(pred)

    assert pred.winner_points == 25
    assert pred.pole_points == 0


def test_correct_pole_points(db):
    season = make_season(db)
    race = make_race(db, season)
    team = make_team(db)
    winner = make_driver(db, "verstappen", team.id, "VER")
    pole = make_driver(db, "leclerc", team.id, "LEC")
    user = make_user(db)

    make_race_result(db, race, winner, position=1)
    make_qualifying_result(db, race, pole, position=1)

    pred = make_prediction(db, user, race, winner_id=winner.id, pole_id=pole.id)
    calculate_and_award_points(race.id, db)
    db.refresh(pred)

    assert pred.winner_points == 25
    assert pred.pole_points == 15


def test_double_hit_bonus(db):
    season = make_season(db)
    race = make_race(db, season)
    team = make_team(db)
    driver = make_driver(db, "verstappen", team.id, "VER")
    user = make_user(db)

    make_race_result(db, race, driver, position=1)
    make_qualifying_result(db, race, driver, position=1)

    pred = make_prediction(db, user, race, winner_id=driver.id, pole_id=driver.id)
    calculate_and_award_points(race.id, db)
    db.refresh(pred)

    # 25 (winner) + 15 (pole) + 10 (double hit) + 20 (perfect weekend) = 50
    assert pred.winner_points == 25
    assert pred.pole_points == 15
    assert pred.bonus_points >= 30  # double hit + perfect weekend
    assert pred.total_points_earned == 70


def test_no_points_for_wrong_prediction(db):
    season = make_season(db)
    race = make_race(db, season)
    team = make_team(db)
    winner = make_driver(db, "verstappen", team.id, "VER")
    loser = make_driver(db, "hamilton", team.id, "HAM")
    user = make_user(db)

    make_race_result(db, race, winner, position=1)
    make_qualifying_result(db, race, winner, position=1)

    pred = make_prediction(db, user, race, winner_id=loser.id, pole_id=loser.id)
    calculate_and_award_points(race.id, db)
    db.refresh(pred)

    assert pred.total_points_earned == 0


def test_early_bird_bonus(db):
    season = make_season(db)
    race = make_race(db, season)
    team = make_team(db)
    driver = make_driver(db, "verstappen", team.id, "VER")
    user = make_user(db)

    make_race_result(db, race, driver, position=1)
    make_qualifying_result(db, race, driver, position=1)

    # Submit well before qualifying (more than 48 hours)
    pred = models.Prediction(
        user_id=user.id,
        race_id=race.id,
        predicted_winner_id=driver.id,
        predicted_pole_id=driver.id,
        is_locked=True,
        submitted_at=datetime.utcnow() - timedelta(days=4),
    )
    db.add(pred)
    db.flush()

    calculate_and_award_points(race.id, db)
    db.refresh(pred)

    assert pred.bonus_points >= 2  # early bird


def test_user_total_points_updated(db):
    season = make_season(db)
    race = make_race(db, season)
    team = make_team(db)
    driver = make_driver(db, "verstappen", team.id, "VER")
    user = make_user(db)

    make_race_result(db, race, driver, position=1)
    make_qualifying_result(db, race, driver, position=1)
    make_prediction(db, user, race, winner_id=driver.id, pole_id=driver.id)

    calculate_and_award_points(race.id, db)
    db.refresh(user)

    assert user.total_points > 0
