import "dotenv/config";
import express from "express";
import { pool } from "./database.js";
import { findPass } from "./passes.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const app = express();
const port = Number(process.env.PORT ?? 3000); 

const clientDist = fileURLToPath(
  new URL("../../client/dist/", import.meta.url)
);

const clientIndex = path.join(clientDist, "index.html");

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

app.use(express.static(clientDist, {
  index: false
}));

//to check connection with React
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Hello from server!"
  });
});

app.get("/api/stats", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         COUNT(*)::int AS total,
         (COUNT(*) FILTER (
           WHERE status = 'ACTIVE'
         ))::int AS active
       FROM passes`
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not load pass statistics");

    if (error instanceof Error) {
      console.error(error.message);
    }

    res.status(500).json({
      error: "Could not load pass statistics"
    });
  }
});

app.get("/api/public-passes/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const pass = await findPass(req.params.id);

  if (!pass) {
    res.status(404).json({
      error: "Pass not found"
    });
    return;
  }

  res.json(pass);
});

app.get("/", (_req, res) => {
  res.sendFile(clientIndex);
});

app.get("/info/:id", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const pass = await findPass(req.params.id);

  if (!pass) {
    res.status(404).send("Pass not found");
    return;
  }

  res.sendFile(clientIndex);
});

app.use((_req, res) => {
    res.status(404).json({
        status: "error",
        message: "404 Not Found"
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server:  http://localhost:${port}`);
});