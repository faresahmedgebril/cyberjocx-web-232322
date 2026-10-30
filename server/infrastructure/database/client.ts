import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "../../../drizzle/schema";
import { ENV } from "../../config/env";

let pool: Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export async function getDatabase() {
  if (!ENV.DATABASE_URL) return null;

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
