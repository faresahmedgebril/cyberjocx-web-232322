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
function deriveScrypt(password: string, salt: Uint8Array, length: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, Buffer.from(salt), length, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}
async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = await deriveScrypt(password, salt, 64);
  return "scrypt$" + salt.toString("base64url") + "$" + derived.toString("base64url");
}
function hashResetToken(token: string) { return crypto.createHash("sha256").update(token).digest("hex"); }
async function verifyPassword(password: string, stored: string) {
  const [scheme, saltText, hashText] = stored.split("$");
  if (scheme !== "scrypt" || !saltText || !hashText) return false;
  try {
    const salt = Buffer.from(saltText, "base64url");
    const expected = Buffer.from(hashText, "base64url");
    const actual = await deriveScrypt(password, salt, expected.length);
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


const SUPPORT_CATEGORIES = new Set(["account", "password", "technical", "courses", "billing", "security", "other"]);
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
async function sendSupportEmail(input: { name: string; email: string; category: string; subject: string; message: string }) {
  if (!ENV.RESEND_API_KEY || !ENV.AUTH_EMAIL_FROM || !ENV.SUPPORT_INBOX_EMAIL) {
    throw new Error("Support email is not configured yet.");
  }
  const categoryLabels: Record<string, string> = {
    account: "Account and sign-in",
    password: "Password recovery",
    technical: "Technical issue",
    courses: "Courses and learning",
    billing: "Subscriptions and billing",
    security: "Security report",
    other: "Other",
  };
  const safeName = escapeHtml(input.name);
  const safeEmail = escapeHtml(input.email);
  const safeSubject = escapeHtml(input.subject);
  const safeMessage = escapeHtml(input.message).replace(/\\r?\\n/g, "<br>");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + ENV.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: ENV.AUTH_EMAIL_FROM,
      to: [ENV.SUPPORT_INBOX_EMAIL],
      reply_to: input.email,
      subject: "[CyberJocx Support] " + input.subject,
      text: [
        "New CyberJocx support request",
        "Name: " + input.name,
        "Email: " + input.email,
        "Category: " + (categoryLabels[input.category] ?? input.category),
        "Subject: " + input.subject,
        "",
        input.message,
      ].join("\\n"),
      html: "<div style=\"font-family:Arial,sans-serif;background:#05091c;color:#eaf1ff;padding:28px;border-radius:12px\">" +
        "<h2 style=\"color:#a95cff\">CyberJocx Support Request</h2>" +
        "<p><b>Name:</b> " + safeName + "</p>" +
        "<p><b>Email:</b> " + safeEmail + "</p>" +
        "<p><b>Category:</b> " + escapeHtml(categoryLabels[input.category] ?? input.category) + "</p>" +
        "<p><b>Subject:</b> " + safeSubject + "</p>" +
        "<hr style=\"border-color:#263b63\"><p style=\"line-height:1.8\">" + safeMessage + "</p></div>",
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("[Support] email provider rejected request", response.status, detail.slice(0, 200));
    throw new Error("Unable to deliver the support request right now.");
  }
}

export function registerSupportRoutes(app: Express) {
  app.post("/api/support", async (req: Request, res: Response) => {
    try {
      const name = String(req.body?.name ?? "").trim();
      const email = normalizeEmail(String(req.body?.email ?? ""));
      const category = String(req.body?.category ?? "");
      const subject = String(req.body?.subject ?? "").trim();
      const message = String(req.body?.message ?? "").trim();
      const website = String(req.body?.website ?? "").trim();

      // Quietly absorb automated submissions caught by the honeypot.
      if (website) return res.status(202).json({ ok: true });

      if (name.length < 2 || name.length > 100) return fail(res, 400, "اكتب اسمًا صحيحًا.");
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return fail(res, 400, "اكتب بريدًا إلكترونيًا صحيحًا.");
      if (!SUPPORT_CATEGORIES.has(category)) return fail(res, 400, "اختار نوع المشكلة.");
      if (subject.length < 5 || subject.length > 140) return fail(res, 400, "عنوان الرسالة يجب أن يكون من 5 إلى 140 حرفًا.");
      if (message.length < 20 || message.length > 5000) return fail(res, 400, "تفاصيل المشكلة يجب أن تكون من 20 إلى 5000 حرف.");
      if (!ENV.RESEND_API_KEY || !ENV.AUTH_EMAIL_FROM || !ENV.SUPPORT_INBOX_EMAIL) {
        return fail(res, 503, "استقبال رسائل الدعم غير مفعّل حاليًا. حاول لاحقًا.");
      }

      await sendSupportEmail({ name, email, category, subject, message });
      return res.status(202).json({ ok: true, message: "Support request accepted." });
    } catch (error) {
      console.error("[Support] request failed", error instanceof Error ? error.message : String(error));
      return fail(res, 503, "تعذر إرسال رسالتك حاليًا. حاول مرة أخرى بعد قليل.");
    }
  });
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
      await upsertUser({ openId: "email:" + email, name, email, loginMethod: "password", passwordHash: await hashPassword(password), lastSignedIn: new Date() });
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
      if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return fail(res, 401, "Invalid email or password.");
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
        passwordHash: await hashPassword(password), loginMethod: "password",
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
