import { AsyncLocalStorage } from "node:async_hooks";
import { Client, Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../drizzle/schema";
import { ENV } from "../../config/env";

type Database = NodePgDatabase<typeof schema>;

export interface RequestDatabaseScope {
  getDatabase(): Promise<Database>;
  close(): Promise<void>;
}

const requestDatabaseScope = new AsyncLocalStorage<RequestDatabaseScope>();

let pool: Pool | null = null;
let db: Database | null = null;

/**
 * Create a lazy PostgreSQL connection whose lifetime is bounded by one HTTP
 * request. Hyperdrive owns connection pooling in Cloudflare; a module-global
 * pg Pool/Client must never be reused across Worker invocations.
 */
export function createRequestDatabaseScope(connectionString: string): RequestDatabaseScope {
  let client: Client | null = null;
  let databasePromise: Promise<Database> | null = null;
  let closePromise: Promise<void> | null = null;
  let closed = false;

  return {
    async getDatabase() {
      if (closed) throw new Error("Request database scope is already closed");

      if (!databasePromise) {
        const requestClient = new Client({
          connectionString,
          connectionTimeoutMillis: 10_000,
          keepAlive: true,
        });
        client = requestClient;

        databasePromise = requestClient.connect()
          .then(() => drizzle(requestClient, { schema }))
          .catch(async error => {
            if (client === requestClient) client = null;
            databasePromise = null;
            await requestClient.end().catch(() => undefined);
            throw error;
          });
      }

      return databasePromise;
    },

    async close() {
      if (closePromise) return closePromise;
      closed = true;

      closePromise = (async () => {
        // A request can finish while its first connection attempt is pending.
        // Wait for that attempt before releasing the client.
        if (databasePromise) await databasePromise.catch(() => undefined);
        const activeClient = client;
        client = null;
        if (activeClient) await activeClient.end();
      })();

      return closePromise;
    },
  };
}

export function runWithRequestDatabaseScope<T>(
  scope: RequestDatabaseScope,
  callback: () => T,
): T {
  return requestDatabaseScope.run(scope, callback);
}

export async function getDatabase(): Promise<Database | null> {
  const requestScope = requestDatabaseScope.getStore();
  if (requestScope) return requestScope.getDatabase();

  // Fail closed in the Cloudflare Worker rather than silently falling back to
  // a global connection if a route ever bypasses the request-scope middleware.
  if (process.env.DB_REQUEST_SCOPED === "true") {
    throw new Error("Request-scoped database context is missing");
  }

  if (!ENV.DATABASE_URL) return null;

  // Persistent Node.js hosts (local development / conventional servers) keep
  // the existing process-scoped pool. Cloudflare sets DB_REQUEST_SCOPED=true.
  if (!pool) {
    pool = new Pool({
      connectionString: ENV.DATABASE_URL,
      max: Number(process.env.DB_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      keepAlive: true,
    });
    pool.on("error", error => {
      console.error("[Database] PostgreSQL pool error", error);
    });
    db = drizzle(pool, { schema });
  }

  return db;
}

export async function closeDatabase() {
  if (pool) await pool.end();
  pool = null;
  db = null;
}
