import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";
import type { Express, Request, Response } from "express";

const mocks = vi.hoisted(() => {
  const state: {
    users: Array<Record<string, any>>;
    sessions: Array<Record<string, any>>;
    db: any;
    env: Record<string, string>;
    nextUserId: number;
  } = {
    users: [],
    sessions: [],
    db: null,
    env: {
      APP_WEB_URL: "https://faresahmedgebril.github.io/cyberjocx-web-232322",
      RESEND_API_KEY: "test-resend-key",
      AUTH_EMAIL_FROM: "CyberJocx <no-reply@example.test>",
      SESSION_TTL_MS: String(30 * 24 * 60 * 60 * 1000),
      SESSION_COOKIE_SECURE: "true",
      SESSION_COOKIE_DOMAIN: "",
      SESSION_COOKIE_SAMESITE: "lax",
    },
    nextUserId: 1,
  };

  return {
    state,
    getDb: vi.fn(async () => state.db),
    upsertUser: vi.fn(async (input: Record<string, any>) => {
      const existing = state.users.find(user => user.openId === input.openId);
      if (existing) {
        Object.assign(existing, input, { lastSignedIn: new Date() });
      } else {
        state.users.push({
          id: state.nextUserId++,
          role: "user",
          points: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
          ...input,
        });
      }
    }),
    createSession: vi.fn(async () => ({ token: "test-session-token" })),
    sessionCookie: vi.fn(() => "cyberjocx_session=test-session-token; Path=/; HttpOnly; Secure"),
  };
});

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  upsertUser: mocks.upsertUser,
}));

vi.mock("./config/env", () => ({
  ENV: mocks.state.env,
}));

vi.mock("./core/auth/session", () => ({
  createSession: mocks.createSession,
  sessionCookie: mocks.sessionCookie,
}));

vi.mock("drizzle-orm", async importOriginal => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    eq: (column: { name: string }, value: unknown) => ({
      kind: "eq",
      column: column.name,
      value,
    }),
    isNull: (column: { name: string }) => ({
      kind: "isNull",
      column: column.name,
    }),
    and: (...conditions: unknown[]) => ({
      kind: "and",
      conditions,
    }),
  };
});

import { users, sessions } from "../drizzle/schema";
import { registerPasswordAuthRoutes } from "./passwordAuth";

type Handler = (req: Request, res: Response) => unknown;

function matches(row: Record<string, any>, condition: any): boolean {
  if (!condition) return true;
  if (condition.kind === "eq") return row[condition.column] === condition.value;
  if (condition.kind === "isNull") return row[condition.column] == null;
  if (condition.kind === "and") return condition.conditions.every((part: any) => matches(row, part));
  return false;
}

function createMemoryDb() {
  const rowsFor = (table: unknown) => table === users ? mocks.state.users : mocks.state.sessions;

  return {
    select: () => ({
      from: (table: unknown) => ({
        where: (condition: unknown) => ({
          limit: async (count = 1) => rowsFor(table).filter(row => matches(row, condition)).slice(0, count),
        }),
      }),
    }),
    update: (table: unknown) => ({
      set: (values: Record<string, any>) => ({
        where: async (condition: unknown) => {
          const affected = rowsFor(table).filter(row => matches(row, condition));
          affected.forEach(row => Object.assign(row, values));
          return affected;
        },
      }),
    }),
  };
}

function createRoutes() {
  const handlers = new Map<string, Handler>();
  const app = {
    post: (path: string, handler: Handler) => handlers.set(path, handler),
  } as unknown as Express;
  registerPasswordAuthRoutes(app);
  return handlers;
}

async function post(
  handlers: Map<string, Handler>,
  path: string,
  body: Record<string, unknown>,
) {
  const result: { status: number; body: any; headers: Record<string, string> } = {
    status: 200,
    body: undefined,
    headers: {},
  };
  const res = {
    status(code: number) {
      result.status = code;
      return this;
    },
    json(payload: unknown) {
      result.body = payload;
      return this;
    },
    setHeader(name: string, value: string | string[]) {
      result.headers[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value;
      return this;
    },
  };

  const handler = handlers.get(path);
  if (!handler) throw new Error(`Missing route handler for ${path}`);

  await handler(
    {
      body,
      secure: true,
      protocol: "https",
      ip: "203.0.113.10",
      headers: { "x-forwarded-proto": "https", "user-agent": "Vitest" },
    } as unknown as Request,
    res as unknown as Response,
  );
  return result;
}

function seedUser(overrides: Record<string, any> = {}) {
  const user = {
    id: 77,
    openId: "email:test@example.com",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "password",
    passwordHash: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    role: "user",
    lastSignedIn: new Date(),
    ...overrides,
  };
  mocks.state.users.push(user);
  return user;
}

describe("password authentication routes", () => {
  beforeEach(() => {
    mocks.state.users.splice(0);
    mocks.state.sessions.splice(0);
    mocks.state.nextUserId = 1;
    mocks.state.db = createMemoryDb();
    mocks.getDb.mockClear();
    mocks.upsertUser.mockClear();
    mocks.createSession.mockClear();
    mocks.sessionCookie.mockClear();
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => "",
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers a password account with a salted hash and an HttpOnly session cookie", async () => {
    const result = await post(createRoutes(), "/api/auth/register", {
      name: "Test User",
      email: " TEST@EXAMPLE.COM ",
      password: "correct horse battery",
    });

    expect(result.status).toBe(201);
    expect(result.body.ok).toBe(true);
    expect(result.body.user.email).toBe("test@example.com");
    expect(mocks.state.users).toHaveLength(1);
    expect(mocks.state.users[0].passwordHash).toMatch(/^scrypt\$/);
    expect(mocks.state.users[0].passwordHash).not.toContain("correct horse battery");
    expect(result.body.user).not.toHaveProperty("passwordHash");
    expect(result.body).not.toHaveProperty("token");
    expect(result.headers["set-cookie"]).toContain("HttpOnly");
    expect(mocks.createSession).toHaveBeenCalledWith(1, expect.any(Object));
  });

  it("logs in with a normalized email and the correct password", async () => {
    const handlers = createRoutes();
    const registered = await post(handlers, "/api/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "correct horse battery",
    });
    expect(registered.status).toBe(201);

    const result = await post(handlers, "/api/auth/login", {
      email: " TEST@EXAMPLE.COM ",
      password: "correct horse battery",
      rememberMe: false,
    });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      ok: true,
      user: { id: 1, email: "test@example.com", role: "user" },
    });
    expect(result.body).not.toHaveProperty("token");
    expect(result.headers["set-cookie"]).toContain("HttpOnly");
    expect(mocks.sessionCookie).toHaveBeenLastCalledWith("test-session-token", true, false);
  });

  it("rejects incorrect credentials without revealing whether the email exists", async () => {
    const handlers = createRoutes();
    const registered = await post(handlers, "/api/auth/register", {
      name: "Test User",
      email: "test@example.com",
      password: "correct horse battery",
    });
    expect(registered.status).toBe(201);

    const wrongPassword = await post(handlers, "/api/auth/login", {
      email: "test@example.com",
      password: "definitely-wrong",
    });
    const unknownEmail = await post(handlers, "/api/auth/login", {
      email: "missing@example.com",
      password: "definitely-wrong",
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe("Invalid email or password.");
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it("rejects duplicate registrations", async () => {
    const handlers = createRoutes();
    const payload = {
      name: "Test User",
      email: "test@example.com",
      password: "correct horse battery",
    };
    expect((await post(handlers, "/api/auth/register", payload)).status).toBe(201);

    const duplicate = await post(handlers, "/api/auth/register", payload);

    expect(duplicate.status).toBe(409);
    expect(mocks.state.users).toHaveLength(1);
  });

  it("uses the same password-reset response for existing and unknown emails", async () => {
    const handlers = createRoutes();
    seedUser();

    const existing = await post(handlers, "/api/auth/forgot-password", {
      email: "test@example.com",
    });
    const unknown = await post(handlers, "/api/auth/forgot-password", {
      email: "unknown@example.com",
    });

    expect(existing.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(existing.body.message).toBe(unknown.body.message);
    expect(existing.body.message).toContain("If the address is registered");
    expect(mocks.state.users[0].passwordResetTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(mocks.state.users[0].passwordResetExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("resets the password once, clears the reset token, and revokes existing sessions", async () => {
    const handlers = createRoutes();
    const token = "single-use-reset-token";
    const user = seedUser({
      passwordResetTokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      passwordResetExpiresAt: new Date(Date.now() + 60_000),
    });
    mocks.state.sessions.push(
      { id: 1, userId: user.id, revokedAt: null },
      { id: 2, userId: user.id, revokedAt: null },
      { id: 3, userId: 999, revokedAt: null },
    );

    const result = await post(handlers, "/api/auth/reset-password", {
      email: user.email,
      token,
      password: "new secure password",
    });

    expect(result.status).toBe(200);
    expect(result.body.ok).toBe(true);
    expect(user.passwordHash).toMatch(/^scrypt\$/);
    expect(user.passwordResetTokenHash).toBeNull();
    expect(user.passwordResetExpiresAt).toBeNull();
    expect(mocks.state.sessions.filter(session => session.userId === user.id).every(session => session.revokedAt instanceof Date)).toBe(true);
    expect(mocks.state.sessions.find(session => session.userId === 999)?.revokedAt).toBeNull();

    const reused = await post(handlers, "/api/auth/reset-password", {
      email: user.email,
      token,
      password: "another secure password",
    });
    expect(reused.status).toBe(400);

    const login = await post(handlers, "/api/auth/login", {
      email: user.email,
      password: "new secure password",
    });
    expect(login.status).toBe(200);
  });

  it("rejects expired password-reset tokens", async () => {
    const handlers = createRoutes();
    const token = "expired-reset-token";
    const user = seedUser({
      passwordResetTokenHash: crypto.createHash("sha256").update(token).digest("hex"),
      passwordResetExpiresAt: new Date(Date.now() - 1_000),
    });

    const result = await post(handlers, "/api/auth/reset-password", {
      email: user.email,
      token,
      password: "new secure password",
    });

    expect(result.status).toBe(400);
    expect(user.passwordHash).toBeNull();
  });
});
