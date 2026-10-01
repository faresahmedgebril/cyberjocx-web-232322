import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { users } from "./../drizzle/schema";
import { getDb, upsertUser } from "./db";
import { ENV } from "./config/env";
import { sessionCookie, createSession } from "./core/auth/session";

const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

function verifyPassword(password: string, stored: string) {
  const [scheme, saltText, hashText] = stored.split("$");
  if (scheme !== "scrypt" || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    const actual = crypto.scryptSync(password, salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function fail(res: Response, status: number, message: string) {
  res.status(status).json({ ok: false, message });
}

export function registerPasswordAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(String(req.body?.email ?? ""));
      const password = String(req.body?.password ?? "");
      const name = String(req.body?.name ?? "").trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Enter a valid email address.");
      if (password.length < MIN_PASSWORD_LENGTH) return fail(res, 400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      if (password.length > 128) return fail(res, 400, "Password is too long.");
      if (name.length < 2 || name.length > 120) return fail(res, 400, "Name must be between 2 and 120 characters.");

      const db = await getDb();
      if (!db) return fail(res, 503, "Database unavailable.");
      const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (existing) return fail(res, 409, "An account already exists with this email.");

      await upsertUser({
        openId: `email:${email}`,
        name,
        email,
        loginMethod: "password",
        passwordHash: hashPassword(password),
        lastSignedIn: new Date(),
      });

      const user = (await db.select().from(users).where(eq(users.openId, `email:${email}`)).limit(1))[0];
      if (!user) return fail(res, 500, "Account creation failed.");

      const { token } = await createSession(user.id, req);
      res.setHeader("Set-Cookie", sessionCookie(token, true));
      res.status(201).json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("[Password Auth] register failed", error instanceof Error ? error.message : String(error));
      fail(res, 500, "Unable to create the account right now.");
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(String(req.body?.email ?? ""));
      const password = String(req.body?.password ?? "");
      if (!email || !password) return fail(res, 400, "Email and password are required.");

      const db = await getDb();
      if (!db) return fail(res, 503, "Database unavailable.");
      const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return fail(res, 401, "Invalid email or password.");

      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      const { token } = await createSession(user.id, req);
      res.setHeader("Set-Cookie", sessionCookie(token, true));
      res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("[Password Auth] login failed", error instanceof Error ? error.message : String(error));
      fail(res, 500, "Unable to sign in right now.");
    }
  });
}
