import { useState, useEffect } from "react";

/**
 * Root application component.
 *
 * Fetches a hello-world message from the backend API and displays it.
 */
export default function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Failed to connect to backend"));
  }, []);

  return (
    <div className="app-container">
      <h1>{message}</h1>
    </div>
  );
}
