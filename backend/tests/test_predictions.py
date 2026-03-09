import pytest
from datetime import datetime, timedelta
from unittest.mock import patch
from app import models
from tests.conftest import TestingSessionLocal


def make_test_data(db):
    season = models.Season(year=2024, is_current=True)
    db.add(season)
    db.flush()

    race = models.Race(
        season_id=season.id,
        round=1,
        name="Test GP",
        status="upcoming",
        qualifying_date=datetime.utcnow() + timedelta(days=3),
        race_date=datetime.utcnow() + timedelta(days=4),
    )
    db.add(race)

    team = models.Team(team_ref="ferrari", name="Ferrari", primary_color_hex="#E8001C")
    db.add(team)
    db.flush()

    driver1 = models.Driver(driver_ref="verstappen", code="VER", current_team_id=team.id)
    driver2 = models.Driver(driver_ref="hamilton", code="HAM", current_team_id=team.id)
    db.add_all([driver1, driver2])
    db.flush()

    return season, race, driver1, driver2


def test_submit_prediction(client, db):
    _, race, d1, d2 = make_test_data(db)
    db.commit()

    user = models.User(google_uid="uid1", email="test@test.com", display_name="Test")
    db.add(user)
    db.commit()

    with patch("app.auth.verify_firebase_token") as mock_verify:
        mock_verify.return_value = {"uid": "uid1"}
        resp = client.post(
            "/api/predictions",
            json={"race_id": race.id, "predicted_winner_id": d1.id, "predicted_pole_id": d2.id},
            headers={"Authorization": "Bearer fake_token"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["predicted_winner_id"] == d1.id
    assert data["predicted_pole_id"] == d2.id
    assert data["is_locked"] == False


def test_prediction_locked_after_qualifying(client, db):
    season = models.Season(year=2024, is_current=True)
    db.add(season)
    db.flush()

    race = models.Race(
        season_id=season.id,
        round=1,
        name="Test GP",
        status="racing",
        qualifying_date=datetime.utcnow() - timedelta(hours=2),  # already passed
        race_date=datetime.utcnow() + timedelta(hours=1),
    )
    db.add(race)
    team = models.Team(team_ref="ferrari", name="Ferrari", primary_color_hex="#E8001C")
    db.add(team)
    db.flush()
    d1 = models.Driver(driver_ref="verstappen", code="VER", current_team_id=team.id)
    d2 = models.Driver(driver_ref="hamilton", code="HAM", current_team_id=team.id)
    db.add_all([d1, d2])

    user = models.User(google_uid="uid1", email="test@test.com")
    db.add(user)
    db.commit()

    with patch("app.auth.verify_firebase_token") as mock_verify:
        mock_verify.return_value = {"uid": "uid1"}
        resp = client.post(
            "/api/predictions",
            json={"race_id": race.id, "predicted_winner_id": d1.id, "predicted_pole_id": d2.id},
            headers={"Authorization": "Bearer fake_token"},
        )
    assert resp.status_code == 400
    assert "locked" in resp.json()["detail"].lower()


def test_update_prediction_before_lock(client, db):
    _, race, d1, d2 = make_test_data(db)
    user = models.User(google_uid="uid1", email="test@test.com")
    db.add(user)
    db.commit()

    with patch("app.auth.verify_firebase_token") as mock_verify:
        mock_verify.return_value = {"uid": "uid1"}
        # First submit
        client.post(
            "/api/predictions",
            json={"race_id": race.id, "predicted_winner_id": d1.id, "predicted_pole_id": d2.id},
            headers={"Authorization": "Bearer fake_token"},
        )
        # Update
        resp = client.post(
            "/api/predictions",
            json={"race_id": race.id, "predicted_winner_id": d2.id, "predicted_pole_id": d1.id},
            headers={"Authorization": "Bearer fake_token"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["predicted_winner_id"] == d2.id


def test_get_prediction_history(client, db):
    _, race, d1, d2 = make_test_data(db)
    user = models.User(google_uid="uid1", email="test@test.com")
    db.add(user)
    db.commit()

    with patch("app.auth.verify_firebase_token") as mock_verify:
        mock_verify.return_value = {"uid": "uid1"}
        client.post(
            "/api/predictions",
            json={"race_id": race.id, "predicted_winner_id": d1.id, "predicted_pole_id": d2.id},
            headers={"Authorization": "Bearer fake_token"},
        )
        resp = client.get("/api/predictions/history", headers={"Authorization": "Bearer fake_token"})

    assert resp.status_code == 200
    assert len(resp.json()) == 1
