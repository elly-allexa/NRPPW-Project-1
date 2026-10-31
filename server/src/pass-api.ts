import express from "express";
import type { ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { auth as jwtAuth, requiredScopes, UnauthorizedError } from "express-oauth2-jwt-bearer"; //jwtAuth instead of auth because auth is used for oidc
import { findPass, insertPass } from "./passes.js";

export function createPassApi(issuerBaseURL: string, audience: string, baseURL: string) {
  const router = express.Router();

  router.use(jwtAuth({issuerBaseURL, audience, tokenSigningAlg: "RS256"}));

  router.get("/:id", requiredScopes("read:passes"), async (req, res) => {
      res.set("Cache-Control", "no-store");

      if (typeof req.params.id !== "string") {
      res.status(404).json({
        error: "Pass not found"
      });
      return;
    }

      const pass = await findPass(req.params.id);

      if (!pass) {
        res.status(404).json({
          error: "Pass not found"
        });
        return;
      }

      res.json(pass);
    }
  );

  router.post("/", requiredScopes("create:passes"), express.json(), async (req, res) => {
      const name: unknown = req.body?.name;
      const document: unknown = req.body?.document;

      if (typeof name !== "string" || typeof document !== "string" || name.trim().length === 0 || document.trim().length === 0) {
        res.status(400).json({
          error: "name and document must be non-empty strings!"
        });
        return;
      }

      const id = randomUUID();

      const publicURL = new URL(`/info/${id}`, baseURL).href;

      const apiURL = new URL(`/passes/${id}`,baseURL).href;

      const png = await QRCode.toBuffer(publicURL, {
        type: "png",
        width: 400,
        margin: 4
      });

      await insertPass(id, name, document);

      res
        .status(201)
        .set("Location", apiURL)
        .set("Cache-Control", "no-store")
        .type("image/png")
        .send(png);
    }
  );

  const handleErrors: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof UnauthorizedError) {
      const status = error.status === 403 ? 403 : 401;

      res.set(error.headers);

      res.status(status).json({
        error:
          status === 403 ? "Not sufficient scope" : "Missing or invalid access token"});
      return;
    }

    if (typeof error === "object" && error !== null && "status" in error && error.status === 400) {
      res.status(400).json({
        error: "Invalid request body"
      });
      return;
    }

    console.error(
      "Pass API failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    res.status(500).json({
      error: "Internal server error"
    });
  };

  router.use(handleErrors);

  return router;
}