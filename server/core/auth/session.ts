import crypto from "node:crypto";
import type { Request } from "express";
import { and, eq, gt, isNull } from "drizzle-orm";
import { sessions, users } from "../../../drizzle/schema";
import { getDb, getUserById, upsertUser } from "../../db";
import { COOKIE_NAME } from "../../config/constants";
import { ENV } from "../../config/env";
import { authenticationError } from "../errors";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getSessionToken(req: Request) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  const match = req.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  return match?.slice(COOKIE_NAME.length + 1);
}

export async function createSession(userId: number, req?: Pick<Request, "headers" | "ip">) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const token = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ENV.SESSION_TTL_MS);
  await db.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt, userAgent: req?.headers["user-agent"]?.slice(0, 512), ipAddress: req?.ip?.slice(0, 64) });
  return { token, expiresAt };
}

export async function revokeSession(token: string | undefined) {
  if (!token) return;
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function authenticateRequest(req: Request) {
  const token = getSessionToken(req);
  if (!token) throw authenticationError();
  const db = await getDb();
  if (!db) throw authenticationError();
  const row = (await db.select().from(sessions).where(and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date()))).limit(1))[0];
  if (!row) throw authenticationError("Invalid or expired session");
  const user = await getUserById(row.userId);
  if (!user) throw authenticationError("Session user no longer exists");
  return user;
}

export async function ensureGoogleUser(input: { openId: string; name?: string | null; email?: string | null; avatarUrl?: string | null }) {
  await upsertUser({ openId: input.openId, name: input.name ?? null, email: input.email ?? null, avatarUrl: input.avatarUrl ?? null, loginMethod: "google", lastSignedIn: new Date() });
  const db = await getDb();
  const user = db ? (await db.select().from(users).where(eq(users.openId, input.openId)).limit(1))[0] : undefined;
  if (!user) throw new Error("Unable to load authenticated user");
  return user;
}

export function sessionCookie(token: string, secure: boolean) {
  const cookieSecure = ENV.SESSION_COOKIE_SECURE || secure;
  const domain = ENV.SESSION_COOKIE_DOMAIN ? `; Domain=${ENV.SESSION_COOKIE_DOMAIN}` : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Max-Age=${Math.floor(ENV.SESSION_TTL_MS / 1000)}; SameSite=${ENV.SESSION_COOKIE_SAMESITE}${domain}${cookieSecure ? "; Secure" : ""}`;
}
