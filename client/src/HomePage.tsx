import { useEffect, useState } from "react";
import AuthPanel from "./AuthPanel";
import "./App.css";


type PassStats = {
  total: number;
  active: number;
};

function HomePage() {
  const [stats, setStats] = useState<PassStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadStats() {
      try {
        const response = await fetch("/api/stats");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: PassStats = await response.json();

        if (!ignore) {
          setStats(data);
        }
      } catch (error) {
        if (!ignore) {
          setError(
            error instanceof Error ? error.message : "Unknown error"
          );
        }
      }
    }

    void loadStats();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main>
      <h1>Digital Passes</h1>
      <AuthPanel />

      {error ? (
        <p role="alert">Could not load statistics: {error}</p>
      ) : stats ? (
        <>
          <p>Total passes: {stats.total}</p>
          <p>Active passes: {stats.active}</p>
        </>
      ) : (
        <p>Loading statistics...</p>
      )}
    </main>
  );
}

export default HomePage;