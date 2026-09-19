import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleNvdSync } from "../nvdSync";
import { registerGoogleAuthRoutes } from "../googleAuth";
import { setupVite, serveStatic } from "./vite";
import { ENV } from "../config/env";
import { HEALTH_PATH, READY_PATH } from "../config/constants";
import { corsMiddleware, rateLimit, validateStateChangingOrigin } from "../core/security/middleware";
import { logger } from "../core/logger";
import { closeDatabase } from "../infrastructure/database/client";

export function createApp() {
  const app = express();
  app.set("trust proxy", ENV.TRUST_PROXY ? 1 : false);
  app.use(corsMiddleware);
  app.use(validateStateChangingOrigin);
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));
  app.get(HEALTH_PATH, (_req, res) => res.json({ ok: true, service: "cyberjocx-api", timestamp: new Date().toISOString() }));
  app.get(READY_PATH, async (_req, res) => {
    const { getDb } = await import("../db");
    const db = await getDb();
    res.status(db ? 200 : 503).json({ ok: Boolean(db), database: Boolean(db) });
  });
  app.use("/api/auth/google", rateLimit(ENV.AUTH_RATE_LIMIT), (_req, _res, next) => next());
  registerGoogleAuthRoutes(app);
  app.post("/api/scheduled/nvd-sync", rateLimit(10), handleNvdSync);
  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));
  return app;
}

export async function startServer() {
  const app = createApp();
  const server = createServer(app);
  if (ENV.NODE_ENV === "development") await setupVite(app, server);
  else serveStatic(app);
  server.listen(ENV.PORT, () => logger.info("HTTP server started", { port: ENV.PORT, environment: ENV.NODE_ENV }));
  const shutdown = (signal: string) => {
    logger.info("Graceful shutdown requested", { signal });
    server.close(async error => {
      if (error) { logger.error("HTTP shutdown failed", { error: error.message }); process.exitCode = 1; }
      try { await closeDatabase(); }
      catch (closeError) { logger.error("Database shutdown failed", { error: closeError instanceof Error ? closeError.message : String(closeError) }); process.exitCode = 1; }
      process.exit();
    });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) startServer().catch(error => { logger.error("Server startup failed", { error: error instanceof Error ? error.message : String(error) }); process.exit(1); });
