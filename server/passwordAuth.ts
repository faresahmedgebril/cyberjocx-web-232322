import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { sessions, users } from "./../drizzle/schema";
import { getDb, upsertUser } from "./db";
import { ENV } from "./config/env";
import { sessionCookie, createSession } from "./core/auth/session";

const MIN_PASSWORD_LENGTH = 8;
const RESET_TTL_MS = 30 * 60 * 1000;
const GENERIC_RESET_MESSAGE = "If the address is registered, a password reset link will arrive shortly.";
function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return "scrypt$" + salt.toString("base64url") + "$" + derived.toString("base64url");
}
function hashResetToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
function verifyPassword(password: string, stored: string) {
  const [scheme, saltText, hashText] = stored.split("$");
  if (scheme !== "scrypt" || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    const actual = crypto.scryptSync(password, salt, expected.length);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch { return false; }
}
function secureRequest(req: Request) {
  return req.secure || String(req.headers["x-forwarded-proto"] ?? "").split(",").some(value => value.trim().toLowerCase() === "https");
}
function fail(res: Response, status: number, message: string) { res.status(status).json({ ok: false, message }); }

async function sendResetEmail(email: string, resetUrl: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + ENV.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ENV.AUTH_EMAIL_FROM, to: [email], subject: "Reset your CyberJocx password",
      html: "<div style=\"font-family:Arial,sans-serif;background:#05091c;color:#eaf1ff;padding:32px;border-radius:12px\"><h2 style=\"color:#a95cff\">CyberJocx</h2><p>We received a request to reset your password.</p><p><a href=\"" + resetUrl + "\" style=\"display:inline-block;background:linear-gradient(90deg,#078bff,#8a16ff);padding:13px 22px;border-radius:8px;color:white;text-decoration:none\">Reset password</a></p><p>This link expires in 30 minutes. Ignore this email if you did not request it.</p></div>",
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[Password Auth] email provider rejected reset request", response.status, detail.slice(0, 300));
    throw new Error("Unable to send the password reset email right now.");
  }
}

export function registerPasswordAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(String(req.body?.email ?? ""));
      const password = String(req.body?.password ?? "");
      const name = String(req.body?.name ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Enter a valid email address.");
      if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) return fail(res, 400, "Password must be between 8 and 128 characters.");
      if (name.length < 2 || name.length > 120) return fail(res, 400, "Name must be between 2 and 120 characters.");
      const db = await getDb();
      if (!db) return fail(res, 503, "Database unavailable.");
      const existing = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (existing) return fail(res, 409, "An account already exists with this email.");
      await upsertUser({ openId: "email:" + email, name, email, loginMethod: "password", passwordHash: hashPassword(password), lastSignedIn: new Date() });
      const user = (await db.select().from(users).where(eq(users.openId, "email:" + email)).limit(1))[0];
      if (!user) return fail(res, 500, "Account creation failed.");
      const { token } = await createSession(user.id, req);
      res.setHeader("Set-Cookie", sessionCookie(token, secureRequest(req)));
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
      const rememberMe = req.body?.rememberMe !== false;
      if (!email || !password) return fail(res, 400, "Email and password are required.");
      const db = await getDb();
      if (!db) return fail(res, 503, "Database unavailable.");
      const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) return fail(res, 401, "Invalid email or password.");
      await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
      const { token } = await createSession(user.id, req);
      res.setHeader("Set-Cookie", sessionCookie(token, secureRequest(req), rememberMe));
      res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("[Password Auth] login failed", error instanceof Error ? error.message : String(error));
      fail(res, 500, "Unable to sign in right now.");
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(String(req.body?.email ?? ""));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Enter a valid email address.");
      if (!ENV.APP_WEB_URL || !ENV.RESEND_API_KEY || !ENV.AUTH_EMAIL_FROM) return fail(res, 503, "Password recovery email is not configured yet.");
      const db = await getDb();
      if (!db) return fail(res, 503, "Database unavailable.");
      const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (!user) return res.json({ ok: true, message: GENERIC_RESET_MESSAGE });
      const token = crypto.randomBytes(32).toString("base64url");
      await db.update(users).set({
        passwordResetTokenHash: hashResetToken(token),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
      }).where(eq(users.id, user.id));
      const resetUrl = ENV.APP_WEB_URL.replace(/\/+$/, "") + "/reset-password?" + new URLSearchParams({ token, email }).toString();
      try { await sendResetEmail(email, resetUrl); }
      catch (error) {
        await db.update(users).set({ passwordResetTokenHash: null, passwordResetExpiresAt: null }).where(eq(users.id, user.id));
        throw error;
      }
      return res.json({ ok: true, message: GENERIC_RESET_MESSAGE });
    } catch (error) {
      console.error("[Password Auth] forgot password failed", error instanceof Error ? error.message : String(error));
      fail(res, 503, error instanceof Error ? error.message : "Unable to send the password reset email right now.");
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const email = normalizeEmail(String(req.body?.email ?? ""));
      const token = String(req.body?.token ?? "");
      const password = String(req.body?.password ?? "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !token) return fail(res, 400, "The password reset link is invalid.");
      if (password.length < MIN_PASSWORD_LENGTH || password.length > 128) return fail(res, 400, "Password must be between 8 and 128 characters.");
      const db = await getDb();
      if (!db) return fail(res, 503, "Database unavailable.");
      const user = (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
      if (!user?.passwordResetTokenHash || !user.passwordResetExpiresAt) return fail(res, 400, "This password reset link is invalid or expired.");
      const actual = Buffer.from(hashResetToken(token), "hex");
      const expected = Buffer.from(user.passwordResetTokenHash, "hex");
      if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected) || user.passwordResetExpiresAt.getTime() <= Date.now()) {
        return fail(res, 400, "This password reset link is invalid or expired.");
      }
      await db.update(users).set({
        passwordHash: hashPassword(password), loginMethod: "password",
        passwordResetTokenHash: null, passwordResetExpiresAt: null, lastSignedIn: new Date(),
      }).where(eq(users.id, user.id));
      await db.update(sessions).set({ revokedAt: new Date() }).where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt)));
      return res.json({ ok: true, message: "Password updated. You can sign in with your new password." });
    } catch (error) {
      console.error("[Password Auth] reset password failed", error instanceof Error ? error.message : String(error));
      fail(res, 500, "Unable to reset your password right now.");
    }
  });
}
