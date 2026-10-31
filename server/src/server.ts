import "dotenv/config";
import express from "express";
import { pool } from "./database.js";
import { findPass, listPasses, cancelPass, deletePass } from "./passes.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import oidc from "express-openid-connect";
import type { RequestHandler } from "express";
import { createPassApi } from "./pass-api.js";

const app = express();
const port = Number(process.env.PORT ?? 3000); 

const clientDist = fileURLToPath(
  new URL("../../client/dist/", import.meta.url)
);

const clientIndex = path.join(clientDist, "index.html");

const { auth } = oidc;

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

const baseURL = requiredEnv("BASE_URL");
const appOrigin = new URL(baseURL).origin;

const requireSession: RequestHandler = (req, res, next) => {
  res.set("Cache-Control", "no-store");

  if (!req.oidc.isAuthenticated()) {
    res.status(401).json({
      error: "Login required"
    });
    return;
  }

  next();
};

const requireSameOrigin: RequestHandler = (req, res, next) => { //dont allow requests from other origins(webs) to prevent CSRF attacks
  if (req.get("origin") !== appOrigin) {
    res.status(403).json({
      error: "Forbidden origin"
    });
    return;
  }

  next();
};

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(auth({
  authRequired: false,

  secret: requiredEnv("SESSION_SECRET"),
  baseURL,

  issuerBaseURL: requiredEnv("AUTH0_ISSUER_BASE_URL"),
  clientID: requiredEnv("AUTH0_CLIENT_ID"),
  clientSecret: requiredEnv("AUTH0_CLIENT_SECRET"),

  clientAuthMethod: "client_secret_post",

  authorizationParams: {
    response_type: "code", //using the Authorization Code Flow
    scope: "openid profile email" //requesting OpenID Connect login and users profile and email
  },

  idpLogout: true,

  routes: {
    logout: false
  }
}));

app.use("/passes", createPassApi(requiredEnv("AUTH0_ISSUER_BASE_URL"), requiredEnv("AUTH0_AUDIENCE"), baseURL));

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

app.get("/api/session", (req, res) => {
  res.set("Cache-Control", "no-store");

  if (!req.oidc.isAuthenticated()) {
    res.json({
      authenticated: false,
      user: null
    });
    return;
  }

  res.json({
    authenticated: true,
    user: {
      name:
        req.oidc.user?.name ??
        req.oidc.user?.email ??
        "User",
      email: req.oidc.user?.email ?? null
    }
  });
});

app.post("/logout", (req, res) => {
  if (req.get("origin") !== appOrigin) { //to protect website from CSRF attacks by checking the origin of the request
    res.status(403).send("Forbidden origin");
    return;
  }

  return res.oidc.logout({
    returnTo: baseURL
  });
});

app.get("/api/manage/passes", requireSession, async (_req, res) => {
    const passes = await listPasses();
    res.json(passes);
  }
);

app.post("/api/manage/passes/:id/cancel", requireSession, requireSameOrigin, async (req, res) => {
    if (typeof req.params.id !== "string") {
      res.status(404).json({
        error: "Pass not found"
      });
      return;
    }

    const found = await cancelPass(req.params.id);

    if (!found) {
      res.status(404).json({
        error: "Pass not found"
      });
      return;
    }

    res.json({
      status: "CANCELLED"
    });
  }
);

app.delete("/api/manage/passes/:id", requireSession, requireSameOrigin, async (req, res) => {
    if (typeof req.params.id !== "string") {
      res.status(404).json({
        error: "Pass not found"
      });
      return;
    }

    const found = await deletePass(req.params.id);

    if (!found) {
      res.status(404).json({
        error: "Pass not found"
      });
      return;
    }

    res.status(204).end();
  }
);

app.use((_req, res) => {
    res.status(404).json({
        status: "error",
        message: "404 Not Found"
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server:  http://localhost:${port}`);
});