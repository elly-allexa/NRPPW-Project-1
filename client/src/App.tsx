import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Server not checked yet.");

  async function checkServer() {
    try {
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? `Request failed: ${error.message}`
          : "Request failed."
      );
    }
  }

  return (
    <main>
      <h1>Digital Passes</h1>

      <button onClick={checkServer}>
        Check server
      </button>

      <p>{message}</p>
    </main>
  );
}

export default App;