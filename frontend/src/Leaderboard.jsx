/**
 * Sidebar component that displays the top-10 player leaderboard.
 */
export default function Leaderboard({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="sidebar">
        <h3>Leaderboard</h3>
        <p style={{ fontSize: "0.8rem", textAlign: "center", color: "#888" }}>
          No scores yet
        </p>
      </div>
    );
  }

  return (
    <div className="sidebar">
      <h3>Leaderboard</h3>
      <ol>
        {entries.map((entry, i) => (
          <li key={i}>
            {entry.name} — {entry.high_score}
          </li>
        ))}
      </ol>
    </div>
  );
}
