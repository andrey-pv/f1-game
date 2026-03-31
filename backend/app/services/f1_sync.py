import httpx
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app import models

logger = logging.getLogger(__name__)

# Jolpica is a community-maintained Ergast mirror — use as primary source
JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1"
ERGAST_BASE = "http://ergast.com/api/f1"

TEAM_COLORS = {
    "red_bull": "#3671C6",
    "ferrari": "#E8001C",
    "mercedes": "#27F4D2",
    "mclaren": "#FF8000",
    "aston_martin": "#229971",
    "alpine": "#FF87BC",
    "williams": "#64C4FF",
    "rb": "#6692FF",
    "kick_sauber": "#52E252",
    "haas": "#B6BABD",
}


class DataSyncService:
    def __init__(self, db: Session):
        self.db = db
        self.client = httpx.Client(timeout=30.0)

    def _get(self, path: str) -> Optional[dict]:
        for base in [JOLPICA_BASE, ERGAST_BASE]:
            try:
                url = f"{base}{path}"
                resp = self.client.get(url)
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                logger.warning(f"Failed to fetch {base}{path}: {e}")
        return None

    def _get_or_create_season(self, year: int) -> models.Season:
        season = self.db.query(models.Season).filter(models.Season.year == year).first()
        if not season:
            season = models.Season(year=year, is_current=(year == datetime.utcnow().year))
            self.db.add(season)
            self.db.flush()
        return season

    def fetch_and_store_season_data(self, year: int = None) -> None:
        if year is None:
            year = datetime.utcnow().year
        logger.info(f"Syncing season {year} data...")

        # Mark current season
        self.db.query(models.Season).update({"is_current": False})
        season = self._get_or_create_season(year)
        season.is_current = True
        self.db.commit()

        self._sync_teams(year)
        self._sync_drivers(year)
        self._sync_races(year, season)
        self.db.commit()
        logger.info(f"Season {year} sync complete")

    def _sync_teams(self, year: int) -> None:
        data = self._get(f"/{year}/constructors.json")
        if not data:
            return
        constructors = data.get("MRData", {}).get("ConstructorTable", {}).get("Constructors", [])
        for c in constructors:
            team_ref = c["constructorId"]
            team = self.db.query(models.Team).filter(models.Team.team_ref == team_ref).first()
            if not team:
                team = models.Team(team_ref=team_ref)
                self.db.add(team)
            team.name = c.get("name", team_ref)
            team.nationality = c.get("nationality")
            team.wiki_url = c.get("url")
            team.primary_color_hex = TEAM_COLORS.get(team_ref, "#E8001C")
        self.db.flush()

    def _sync_drivers(self, year: int) -> None:
        data = self._get(f"/{year}/drivers.json")
        if not data:
            return
        drivers_data = data.get("MRData", {}).get("DriverTable", {}).get("Drivers", [])

        # Get driver-team mapping from standings
        standings_data = self._get(f"/{year}/driverStandings.json")
        driver_team_map = {}
        if standings_data:
            standings = standings_data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
            if standings:
                for entry in standings[0].get("DriverStandings", []):
                    did = entry["Driver"]["driverId"]
                    constructors = entry.get("Constructors", [])
                    if constructors:
                        driver_team_map[did] = constructors[-1]["constructorId"]

        for d in drivers_data:
            driver_ref = d["driverId"]
            driver = self.db.query(models.Driver).filter(models.Driver.driver_ref == driver_ref).first()
            if not driver:
                driver = models.Driver(driver_ref=driver_ref)
                self.db.add(driver)
            driver.code = d.get("code")
            driver.forename = d.get("givenName")
            driver.surname = d.get("familyName")
            driver.nationality = d.get("nationality")
            driver.date_of_birth = d.get("dateOfBirth")
            driver.wiki_url = d.get("url")

            team_ref = driver_team_map.get(driver_ref)
            if team_ref:
                team = self.db.query(models.Team).filter(models.Team.team_ref == team_ref).first()
                if team:
                    driver.current_team_id = team.id
        self.db.flush()

    def _sync_races(self, year: int, season: models.Season) -> None:
        data = self._get(f"/{year}.json")
        if not data:
            return
        races_data = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        for r in races_data:
            round_num = int(r["round"])
            race = self.db.query(models.Race).filter(
                models.Race.season_id == season.id,
                models.Race.round == round_num,
            ).first()
            if not race:
                race = models.Race(season_id=season.id, round=round_num)
                self.db.add(race)

            race.name = r.get("raceName", "")
            circuit = r.get("Circuit", {})
            race.circuit = circuit.get("circuitName")
            race.country = circuit.get("Location", {}).get("country")

            race_date_str = r.get("date", "")
            race_time_str = r.get("time", "00:00:00Z")
            if race_date_str:
                try:
                    race.race_date = datetime.fromisoformat(f"{race_date_str}T{race_time_str.rstrip('Z')}")
                except ValueError:
                    pass

            qual = r.get("Qualifying", {})
            qual_date_str = qual.get("date", "")
            qual_time_str = qual.get("time", "00:00:00Z")
            if qual_date_str:
                try:
                    race.qualifying_date = datetime.fromisoformat(f"{qual_date_str}T{qual_time_str.rstrip('Z')}")
                except ValueError:
                    pass

            sprint = r.get("Sprint", {})
            sprint_date_str = sprint.get("date", "")
            if sprint_date_str:
                sprint_time_str = sprint.get("time", "00:00:00Z")
                try:
                    race.sprint_date = datetime.fromisoformat(f"{sprint_date_str}T{sprint_time_str.rstrip('Z')}")
                except ValueError:
                    pass

            # Compute status
            now = datetime.utcnow()
            if race.race_date and race.race_date < now:
                race.status = "completed"
            elif race.qualifying_date and race.qualifying_date < now:
                race.status = "racing"
            else:
                race.status = "upcoming"

        self.db.flush()

    def fetch_race_results(self, round_num: int, year: int = None) -> None:
        if year is None:
            year = datetime.utcnow().year
        logger.info(f"Fetching race results for round {round_num}")

        data = self._get(f"/{year}/{round_num}/results.json")
        if not data:
            return

        results = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        if not results:
            return

        season = self.db.query(models.Season).filter(models.Season.year == year).first()
        if not season:
            return
        race = self.db.query(models.Race).filter(
            models.Race.season_id == season.id, models.Race.round == round_num
        ).first()
        if not race:
            return

        for result in results[0].get("Results", []):
            driver_ref = result["Driver"]["driverId"]
            driver = self.db.query(models.Driver).filter(models.Driver.driver_ref == driver_ref).first()
            if not driver:
                continue

            team_ref = result["Constructor"]["constructorId"]
            team = self.db.query(models.Team).filter(models.Team.team_ref == team_ref).first()

            existing = self.db.query(models.RaceResult).filter(
                models.RaceResult.race_id == race.id,
                models.RaceResult.driver_id == driver.id,
            ).first()
            if not existing:
                existing = models.RaceResult(race_id=race.id, driver_id=driver.id)
                self.db.add(existing)

            pos_str = result.get("position", "")
            existing.position = int(pos_str) if pos_str and pos_str.isdigit() else None
            grid_str = result.get("grid", "")
            existing.grid = int(grid_str) if grid_str and str(grid_str).isdigit() else None
            existing.status = result.get("status")
            try:
                existing.points = float(result.get("points") or 0)
            except (ValueError, TypeError):
                existing.points = 0.0
            existing.team_id = team.id if team else None
            fastest = result.get("FastestLap", {})
            existing.fastest_lap = fastest.get("rank") == "1"

        self.db.commit()

        # Ensure qualifying results exist before scoring (pole position points depend on them)
        existing_qual = self.db.query(models.QualifyingResult).filter(
            models.QualifyingResult.race_id == race.id
        ).count()
        if existing_qual == 0:
            self.fetch_qualifying_results(round_num, year)

        race.status = "completed"
        self.db.commit()

        from app.services.scoring import calculate_and_award_points
        calculate_and_award_points(race.id, self.db)

    def fetch_qualifying_results(self, round_num: int, year: int = None) -> None:
        if year is None:
            year = datetime.utcnow().year
        logger.info(f"Fetching qualifying results for round {round_num}")

        data = self._get(f"/{year}/{round_num}/qualifying.json")
        if not data:
            return

        results = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        if not results:
            return

        season = self.db.query(models.Season).filter(models.Season.year == year).first()
        if not season:
            return
        race = self.db.query(models.Race).filter(
            models.Race.season_id == season.id, models.Race.round == round_num
        ).first()
        if not race:
            return

        # Lock predictions
        preds = self.db.query(models.Prediction).filter(models.Prediction.race_id == race.id).all()
        for p in preds:
            p.is_locked = True

        for result in results[0].get("QualifyingResults", []):
            driver_ref = result["Driver"]["driverId"]
            driver = self.db.query(models.Driver).filter(models.Driver.driver_ref == driver_ref).first()
            if not driver:
                continue

            team_ref = result["Constructor"]["constructorId"]
            team = self.db.query(models.Team).filter(models.Team.team_ref == team_ref).first()

            existing = self.db.query(models.QualifyingResult).filter(
                models.QualifyingResult.race_id == race.id,
                models.QualifyingResult.driver_id == driver.id,
            ).first()
            if not existing:
                existing = models.QualifyingResult(race_id=race.id, driver_id=driver.id)
                self.db.add(existing)

            pos_str = result.get("position", "")
            existing.position = int(pos_str) if pos_str and str(pos_str).isdigit() else None
            existing.q1_time = result.get("Q1")
            existing.q2_time = result.get("Q2")
            existing.q3_time = result.get("Q3")
            existing.team_id = team.id if team else None

        if race.status != "completed":
            race.status = "racing"
        self.db.commit()

    def sync_all(self) -> None:
        year = datetime.utcnow().year
        self.fetch_and_store_season_data(year)

        season = self.db.query(models.Season).filter(models.Season.year == year).first()
        if not season:
            return

        # Sync results for completed races that have no results yet
        completed_races = self.db.query(models.Race).filter(
            models.Race.season_id == season.id,
            models.Race.status == "completed",
        ).all()

        for race in completed_races:
            existing_results = self.db.query(models.RaceResult).filter(
                models.RaceResult.race_id == race.id
            ).count()
            if existing_results == 0:
                self.fetch_race_results(race.round, year)

            existing_qual = self.db.query(models.QualifyingResult).filter(
                models.QualifyingResult.race_id == race.id
            ).count()
            if existing_qual == 0:
                self.fetch_qualifying_results(race.round, year)
