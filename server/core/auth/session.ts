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

function signSession(payload: string) {
  return crypto.createHmac("sha256", ENV.JWT_SECRET!).update(payload).digest("base64url");
}

function createStatelessToken(userId: number, expiresAt: Date) {
  const payload = Buffer.from(JSON.stringify({ sub: userId, exp: expiresAt.getTime() })).toString("base64url");
  return `v1.${payload}.${signSession(payload)}`;
}

function readStatelessToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return null;
  const [version, payload, signature] = parts;
  const expected = signSession(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { sub?: number; exp?: number };
    if (!data.sub || !data.exp || data.exp <= Date.now()) return null;
    return { userId: data.sub, expiresAt: new Date(data.exp) };
  } catch {
    return null;
  }
}

export function getSessionToken(req: Request) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);
  const match = req.headers.cookie?.split(";").map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  return match?.slice(COOKIE_NAME.length + 1);
}

export async function createSession(userId: number, _req?: Pick<Request, "headers" | "ip">) {
  if (!ENV.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  const expiresAt = new Date(Date.now() + ENV.SESSION_TTL_MS);
  const token = createStatelessToken(userId, expiresAt);
  return { token, expiresAt };
}

export async function revokeSession(token: string | undefined) {
  // Stateless sessions are invalidated client-side by clearing the HttpOnly cookie.
  // The database session table is retained for backward compatibility but is no longer
  // part of the login critical path.
  void token;
}

export async function authenticateRequest(req: Request) {
  const token = getSessionToken(req);
  if (!token) throw authenticationError();
  const stateless = readStatelessToken(token);
  if (stateless) {
    const user = await getUserById(stateless.userId);
    if (!user) throw authenticationError("Session user no longer exists");
    return user;
  }

  // Backward compatibility for any older database-backed sessions.
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
