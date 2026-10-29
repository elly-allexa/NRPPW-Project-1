import { useEffect, useState } from "react";
import PassManager from "./PassManager";

type SessionInfo = {
  authenticated: boolean;
  user: {
    name: string;
    email: string | null;
  } | null;
};

export default function AuthPanel() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/session");

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: SessionInfo = await response.json();

        if (!ignore) {
          setSession(data);
        }
      } catch (error) {
        if (!ignore) {
          setError(
            error instanceof Error
              ? error.message
              : "Could not check login."
          );
        }
      }
    }

    void loadSession();

    return () => {
      ignore = true;
    };
  }, []);

  if (error) {
    return <p role="alert">Could not check login: {error}</p>;
  }

  if (!session) {
    return <p>Checking login...</p>;
  }

  if (!session.authenticated) {
    return <a href="/login">Log in</a>;
  }

  return (
  <section>
    <p>Logged in as {session.user?.name}</p>

    <form method="post" action="/logout">
      <button type="submit">Log out</button>
    </form>

    <PassManager />
  </section>
);
}