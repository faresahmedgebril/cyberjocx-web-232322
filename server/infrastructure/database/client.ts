import { drizzle } from "drizzle-orm/mysql2";
import { ENV } from "../../config/env";

let db: ReturnType<typeof drizzle> | null = null;

export async function getDatabase() {
  if (!db && ENV.DATABASE_URL) {
    try { db = drizzle(ENV.DATABASE_URL); }
    catch (error) { console.warn("[Database] connection failed", error); db = null; }
  }
  return db;
}

export async function closeDatabase() {
  const connection = db as unknown as { $client?: { end?: () => Promise<void> } } | null;
  if (connection?.$client?.end) await connection.$client.end();
  db = null;
}
