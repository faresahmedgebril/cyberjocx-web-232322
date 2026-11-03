import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "./config/constants";
import { toClientSafeUser } from "./modules/profile/service";
import type { TrpcContext } from "./_core/context";

const sessionMocks = vi.hoisted(() => ({
  revokeSession: vi.fn(async (_token?: string) => undefined),
}));

vi.mock("./core/auth/session", async importOriginal => {
  const actual = await importOriginal<typeof import("./core/auth/session")>();
  return {
    ...actual,
    revokeSession: sessionMocks.revokeSession,
  };
});

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "google",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    passwordHash: "scrypt$fake-salt$fake-hash",
    passwordResetTokenHash: "private-reset-token-hash",
    passwordResetExpiresAt: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("auth.logout", () => {
  beforeEach(() => {
    sessionMocks.revokeSession.mockReset();
    sessionMocks.revokeSession.mockResolvedValue(undefined);
  });

  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({
      maxAge: -1,
      secure: true,
      sameSite: "none",
      httpOnly: true,
      path: "/",
    });
  });

  it("never returns password credentials or reset secrets in user profile responses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const [authUser, profileUser] = await Promise.all([
      caller.auth.me(),
      caller.profile.me(),
    ]);
    const safePublicProfileUser = toClientSafeUser(ctx.user!);

    for (const user of [authUser, profileUser, safePublicProfileUser]) {
      expect(user).not.toHaveProperty("passwordHash");
      expect(user).not.toHaveProperty("passwordResetTokenHash");
      expect(user).not.toHaveProperty("passwordResetExpiresAt");
    }
  });

  it("waits for server-side session revocation before clearing the cookie", async () => {
    let finishRevocation!: () => void;
    const revocation = new Promise<void>(resolve => {
      finishRevocation = resolve;
    });
    sessionMocks.revokeSession.mockReturnValueOnce(revocation);

    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const logoutResult = caller.auth.logout();

    for (let attempt = 0; attempt < 5 && sessionMocks.revokeSession.mock.calls.length === 0; attempt += 1) {
      await Promise.resolve();
    }

    expect(sessionMocks.revokeSession).toHaveBeenCalledTimes(1);
    expect(clearedCookies).toHaveLength(0);

    finishRevocation();
    await expect(logoutResult).resolves.toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
  });
});
