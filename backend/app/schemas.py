"""Pydantic schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel


class PlayerCreate(BaseModel):
    """Schema for creating a new player."""

    name: str


class ScoreUpdate(BaseModel):
    """Schema for updating a player's score."""

    name: str
    score: float


class PlayerResponse(BaseModel):
    """Schema for player data returned to the client."""

    id: int
    name: str
    high_score: float
    created_at: datetime

    model_config = {"from_attributes": True}


class LeaderboardEntry(BaseModel):
    """Schema for a single leaderboard entry."""

    name: str
    high_score: float

    model_config = {"from_attributes": True}
