import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createApp } from "./app";
import { ENV } from "../config/env";
import { logger } from "../core/logger";
import { closeDatabase } from "../infrastructure/database/client";
import { startEmbeddedWorker } from "../worker";

export { createApp } from "./app";

export async function startServer() {
  const app = createApp();
  const server = createServer(app);
  if (ENV.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./vite");
    serveStatic(app);
  }
  server.listen(ENV.PORT, () => logger.info("HTTP server started", { port: ENV.PORT, environment: ENV.NODE_ENV }));
  const stopWorker = startEmbeddedWorker();
  const shutdown = (signal: string) => {
    logger.info("Graceful shutdown requested", { signal });
    server.close(async error => {
      if (error) { logger.error("HTTP shutdown failed", { error: error.message }); process.exitCode = 1; }
      try { await stopWorker(); await closeDatabase(); }
      catch (closeError) { logger.error("Database shutdown failed", { error: closeError instanceof Error ? closeError.message : String(closeError) }); process.exitCode = 1; }
      process.exit();
    });
  };
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
  return server;
}

if (import.meta.url === "file://" + process.argv[1]) startServer().catch(error => { logger.error("Server startup failed", { error: error instanceof Error ? error.message : String(error) }); process.exit(1); });
