import type { RequestHandler } from "express";
import { ENV } from "../../config/env";
import { logger } from "../../core/logger";
import { getDatabaseErrorMetadata } from "./errorMetadata";
import { createRequestDatabaseScope, runWithRequestDatabaseScope } from "./client";

/**
 * Establish an AsyncLocalStorage database context for each Cloudflare API
 * request. A connection is opened lazily by the first database operation and
 * released when Express finishes or closes the response.
 */
export const requestScopeMiddleware: RequestHandler = (_request, response, next) => {
  if (process.env.DB_REQUEST_SCOPED !== "true") {
    next();
    return;
  }

  if (!ENV.DATABASE_URL) {
    response.status(503).json({ error: "Database unavailable" });
    return;
  }

  const scope = createRequestDatabaseScope(ENV.DATABASE_URL);
  let cleanupStarted = false;

  const cleanup = () => {
    if (cleanupStarted) return;
    cleanupStarted = true;
    void scope.close().catch(error => {
      logger.error("Request database cleanup failed", getDatabaseErrorMetadata(error));
    });
  };

  response.once("finish", cleanup);
  response.once("close", cleanup);

  runWithRequestDatabaseScope(scope, next);
};
