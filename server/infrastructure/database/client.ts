import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import { ENV } from "../../config/env";

let db: ReturnType<typeof drizzle> | null = null;
let schemaReady: Promise<void> | null = null;

async function ensurePasswordAuthSchema(database: ReturnType<typeof drizzle>) {
  const [rows] = await database.execute(sql`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'passwordHash'
  `) as unknown as [Array<{ count: number | string }>, unknown];

  const exists = Number(rows[0]?.count ?? 0) > 0;
  if (!exists) {
    await database.execute(sql`ALTER TABLE \`users\` ADD COLUMN \`passwordHash\` varchar(255) NULL`);
    console.info("[Database] Added missing users.passwordHash column");
  }
}

export async function getDatabase() {
  if (!db && ENV.DATABASE_URL) {
    try {
      db = drizzle(ENV.DATABASE_URL);
      schemaReady = ensurePasswordAuthSchema(db).catch(error => {
        console.error("[Database] auth schema check failed", error);
        throw error;
      });
    } catch (error) {
      console.warn("[Database] connection failed", error);
      db = null;
      schemaReady = null;
    }
  }

  if (db && schemaReady) {
    try {
      await schemaReady;
    } catch {
      db = null;
      schemaReady = null;
      return null;
    }
  }

  return db;
}

export async function closeDatabase() {
  const connection = db as unknown as { $client?: { end?: () => Promise<void> } } | null;
  if (connection?.$client?.end) await connection.$client.end();
  db = null;
  schemaReady = null;
}
