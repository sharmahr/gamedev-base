"""SQLAlchemy ORM models for the game database."""

from sqlalchemy import Column, DateTime, Float, Integer, String, func

from app.database import Base


class Player(Base):
    """Represents a player with a name and high score."""

    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    high_score = Column(Float, default=0.0)
    created_at = Column(DateTime, server_default=func.now())
