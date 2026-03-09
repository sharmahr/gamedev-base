import { useState, useEffect, useCallback } from "react";
import GameScene from "./GameScene.jsx";
import Leaderboard from "./Leaderboard.jsx";

/**
 * Root application component.
 *
 * Manages player registration, score state, and renders the 3D game
 * scene alongside the leaderboard sidebar.
 */
export default function App() {
  const [playerName, setPlayerName] = useState("");
  const [registered, setRegistered] = useState(false);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard");
      if (res.ok) {
        setLeaderboard(await res.json());
      }
    } catch {
      /* backend may not be up yet */
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleRegister = async () => {
    const trimmed = playerName.trim();
    if (!trimmed) return;
    try {
      await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
    } catch {
      /* player may already exist — that's fine */
    }
    setRegistered(true);
  };

  const handleScore = useCallback(
    async (points) => {
      const newScore = score + points;
      setScore(newScore);
      try {
        await fetch("/api/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: playerName.trim(), score: newScore }),
        });
        fetchLeaderboard();
      } catch {
        /* fire-and-forget */
      }
    },
    [score, playerName, fetchLeaderboard]
  );

  return (
    <div className="app-container">
      <div className="header">
        <h1>Hello World Game</h1>
        {registered && <span className="score-display">Score: {score}</span>}
      </div>

      <div className="game-area">
        {!registered ? (
          <div className="overlay">
            <h2>Hello World!</h2>
            <p>Enter your name to start collecting spheres</p>
            <input
              type="text"
              placeholder="Player name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
            />
            <button onClick={handleRegister}>Play</button>
          </div>
        ) : (
          <>
            <GameScene onScore={handleScore} />
            <Leaderboard entries={leaderboard} />
            <div className="instructions">
              Click the glowing spheres to score points!
            </div>
          </>
        )}
      </div>
    </div>
  );
}
