"""FastAPI application entry point for the Hello World game backend."""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Player
from app.schemas import LeaderboardEntry, PlayerCreate, PlayerResponse, ScoreUpdate

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hello World Game API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    """Return a simple health status."""
    return {"status": "ok"}


@app.post("/api/players", response_model=PlayerResponse)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)) -> Player:
    """Register a new player. Returns 400 if the name is already taken."""
    existing = db.query(Player).filter(Player.name == player.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Player already exists")
    db_player = Player(name=player.name)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@app.post("/api/scores", response_model=PlayerResponse)
def update_score(score_update: ScoreUpdate, db: Session = Depends(get_db)) -> Player:
    """Update a player's high score if the new score is higher.

    Creates the player if they don't exist yet.
    """
    player = db.query(Player).filter(Player.name == score_update.name).first()
    if not player:
        player = Player(name=score_update.name, high_score=score_update.score)
        db.add(player)
    elif score_update.score > player.high_score:
        player.high_score = score_update.score
    db.commit()
    db.refresh(player)
    return player


@app.get("/api/leaderboard", response_model=list[LeaderboardEntry])
def get_leaderboard(db: Session = Depends(get_db)) -> list[Player]:
    """Return the top 10 players ordered by high score descending."""
    return (
        db.query(Player).order_by(Player.high_score.desc()).limit(10).all()
    )
