import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float,
    ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    google_uid = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=False)
    display_name = Column(String(256))
    avatar_url = Column(String(512))
    created_at = Column(DateTime, default=datetime.utcnow)
    total_points = Column(Integer, default=0)
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    win_streak = Column(Integer, default=0)
    prediction_streak = Column(Integer, default=0)
    badges_json = Column(Text, default="[]")
    is_admin = Column(Boolean, default=False)

    predictions = relationship("Prediction", back_populates="user")
    user_badges = relationship("UserBadge", back_populates="user")
    leaderboard_snapshots = relationship("LeaderboardSnapshot", back_populates="user")


class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, unique=True, nullable=False)
    is_current = Column(Boolean, default=False)

    races = relationship("Race", back_populates="season")


class Race(Base):
    __tablename__ = "races"

    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    round = Column(Integer, nullable=False)
    name = Column(String(256), nullable=False)
    circuit = Column(String(256))
    country = Column(String(128))
    race_date = Column(DateTime)
    qualifying_date = Column(DateTime)
    sprint_date = Column(DateTime)
    status = Column(String(32), default="upcoming")  # upcoming/qualifying/racing/completed

    season = relationship("Season", back_populates="races")
    race_results = relationship("RaceResult", back_populates="race")
    qualifying_results = relationship("QualifyingResult", back_populates="race")
    predictions = relationship("Prediction", back_populates="race")
    leaderboard_snapshots = relationship("LeaderboardSnapshot", back_populates="race")

    __table_args__ = (UniqueConstraint("season_id", "round"),)


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(Integer, primary_key=True, index=True)
    driver_ref = Column(String(64), unique=True, nullable=False)
    code = Column(String(8))
    forename = Column(String(128))
    surname = Column(String(128))
    nationality = Column(String(64))
    date_of_birth = Column(String(16))
    wiki_url = Column(String(512))
    current_team_id = Column(Integer, ForeignKey("teams.id"))

    current_team = relationship("Team", back_populates="drivers")
    race_results = relationship("RaceResult", back_populates="driver")
    qualifying_results = relationship("QualifyingResult", back_populates="driver")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    team_ref = Column(String(64), unique=True, nullable=False)
    name = Column(String(256), nullable=False)
    nationality = Column(String(64))
    wiki_url = Column(String(512))
    primary_color_hex = Column(String(8), default="#E8001C")

    drivers = relationship("Driver", back_populates="current_team")


class RaceResult(Base):
    __tablename__ = "race_results"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"))
    position = Column(Integer)
    grid = Column(Integer)
    status = Column(String(64))
    points = Column(Float, default=0)
    fastest_lap = Column(Boolean, default=False)

    race = relationship("Race", back_populates="race_results")
    driver = relationship("Driver", back_populates="race_results")
    team = relationship("Team")

    __table_args__ = (UniqueConstraint("race_id", "driver_id"),)


class QualifyingResult(Base):
    __tablename__ = "qualifying_results"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"))
    position = Column(Integer)
    q1_time = Column(String(16))
    q2_time = Column(String(16))
    q3_time = Column(String(16))

    race = relationship("Race", back_populates="qualifying_results")
    driver = relationship("Driver", back_populates="qualifying_results")
    team = relationship("Team")

    __table_args__ = (UniqueConstraint("race_id", "driver_id"),)


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    race_id = Column(Integer, ForeignKey("races.id"), nullable=False)
    predicted_winner_id = Column(Integer, ForeignKey("drivers.id"))
    predicted_pole_id = Column(Integer, ForeignKey("drivers.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    is_locked = Column(Boolean, default=False)
    winner_points = Column(Integer, default=0)
    pole_points = Column(Integer, default=0)
    bonus_points = Column(Integer, default=0)
    total_points_earned = Column(Integer, default=0)

    user = relationship("User", back_populates="predictions")
    race = relationship("Race", back_populates="predictions")
    predicted_winner = relationship("Driver", foreign_keys=[predicted_winner_id])
    predicted_pole = relationship("Driver", foreign_keys=[predicted_pole_id])

    __table_args__ = (UniqueConstraint("user_id", "race_id"),)


class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    points_this_race = Column(Integer, default=0)
    cumulative_points = Column(Integer, default=0)
    rank_this_race = Column(Integer)
    cumulative_rank = Column(Integer)

    race = relationship("Race", back_populates="leaderboard_snapshots")
    user = relationship("User", back_populates="leaderboard_snapshots")

    __table_args__ = (UniqueConstraint("race_id", "user_id"),)


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(64), unique=True, nullable=False)
    name = Column(String(128), nullable=False)
    description = Column(Text)
    icon = Column(String(8))
    criteria_json = Column(Text, default="{}")

    user_badges = relationship("UserBadge", back_populates="badge")


class UserBadge(Base):
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="user_badges")
    badge = relationship("Badge", back_populates="user_badges")

    __table_args__ = (UniqueConstraint("user_id", "badge_id"),)
