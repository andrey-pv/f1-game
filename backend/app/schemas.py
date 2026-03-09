from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# --- User ---
class UserBase(BaseModel):
    email: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserOut(UserBase):
    id: int
    google_uid: str
    total_points: int
    current_streak: int
    longest_streak: int
    win_streak: int
    prediction_streak: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Auth ---
class LoginRequest(BaseModel):
    id_token: str


class LoginResponse(BaseModel):
    user: UserOut
    message: str


# --- Season ---
class SeasonOut(BaseModel):
    id: int
    year: int
    is_current: bool

    class Config:
        from_attributes = True


# --- Team ---
class TeamOut(BaseModel):
    id: int
    team_ref: str
    name: str
    nationality: Optional[str]
    wiki_url: Optional[str]
    primary_color_hex: str

    class Config:
        from_attributes = True


# --- Driver ---
class DriverOut(BaseModel):
    id: int
    driver_ref: str
    code: Optional[str]
    forename: Optional[str]
    surname: Optional[str]
    nationality: Optional[str]
    date_of_birth: Optional[str]
    wiki_url: Optional[str]
    current_team: Optional[TeamOut]

    class Config:
        from_attributes = True


# --- Race ---
class RaceOut(BaseModel):
    id: int
    round: int
    name: str
    circuit: Optional[str]
    country: Optional[str]
    race_date: Optional[datetime]
    qualifying_date: Optional[datetime]
    sprint_date: Optional[datetime]
    status: str

    class Config:
        from_attributes = True


class RaceDetailOut(RaceOut):
    race_results: List["RaceResultOut"] = []
    qualifying_results: List["QualifyingResultOut"] = []


# --- Race Result ---
class RaceResultOut(BaseModel):
    id: int
    position: Optional[int]
    grid: Optional[int]
    status: Optional[str]
    points: Optional[float]
    fastest_lap: bool
    driver: Optional[DriverOut]
    team: Optional[TeamOut]

    class Config:
        from_attributes = True


# --- Qualifying Result ---
class QualifyingResultOut(BaseModel):
    id: int
    position: Optional[int]
    q1_time: Optional[str]
    q2_time: Optional[str]
    q3_time: Optional[str]
    driver: Optional[DriverOut]
    team: Optional[TeamOut]

    class Config:
        from_attributes = True


RaceDetailOut.model_rebuild()


# --- Prediction ---
class PredictionCreate(BaseModel):
    race_id: int
    predicted_winner_id: int
    predicted_pole_id: int


class PredictionOut(BaseModel):
    id: int
    race_id: int
    predicted_winner_id: Optional[int]
    predicted_pole_id: Optional[int]
    submitted_at: datetime
    is_locked: bool
    winner_points: int
    pole_points: int
    bonus_points: int
    total_points_earned: int
    predicted_winner: Optional[DriverOut]
    predicted_pole: Optional[DriverOut]
    race: Optional[RaceOut]

    class Config:
        from_attributes = True


# --- Leaderboard ---
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    display_name: Optional[str]
    avatar_url: Optional[str]
    total_points: int
    win_streak: int
    prediction_streak: int
    predictions_made: int
    accuracy_pct: float


class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    total: int


class MyRankResponse(BaseModel):
    rank: int
    total_points: int
    nearby: List[LeaderboardEntry]


# --- Badge ---
class BadgeOut(BaseModel):
    id: int
    slug: str
    name: str
    description: Optional[str]
    icon: Optional[str]

    class Config:
        from_attributes = True


class UserBadgeOut(BaseModel):
    badge: BadgeOut
    earned_at: datetime

    class Config:
        from_attributes = True


# --- Stats ---
class UserStatsOut(BaseModel):
    user_id: int
    display_name: Optional[str]
    avatar_url: Optional[str]
    total_points: int
    total_predictions: int
    correct_winners: int
    correct_poles: int
    accuracy_pct: float
    win_streak: int
    longest_streak: int
    badges: List[UserBadgeOut]
