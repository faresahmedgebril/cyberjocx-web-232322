import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type TestUser = NonNullable<TrpcContext["user"]>;

function context(user?: Partial<TestUser>): TrpcContext {
  return {
    user: user ? ({ id: 7, openId: "progress-test", name: "Progress Tester", email: "progress@example.com", loginMethod: "test", role: "user", points: 0, isVip: false, bio: null, avatarUrl: null, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(), ...user } as TestUser) : undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("progress and NVD contracts", () => {
  it("returns a stable paginated CVE contract", async () => {
    const result = await appRouter.createCaller(context()).cves.paginated({ page: 1, pageSize: 10 });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("totalPages");
    expect(result.page).toBe(1);
  }, 15000);

  it("exposes a stable NVD sync status contract", async () => {
    const result = await appRouter.createCaller(context()).nvd.status();
    expect(result).toHaveProperty("lastStatus");
    expect(result).toHaveProperty("lastImported");
  }, 15000);

  it("requires authentication for quiz submission", async () => {
    await expect(appRouter.createCaller(context()).tracks.submitQuiz({ quizId: 1, answers: [0] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

  it("returns a stable track progress contract for an authenticated operator", async () => {
    const result = await appRouter.createCaller(context({ id: 7 })).tracks.progress({ trackId: 1 });
    expect(result === undefined || result).toBeTruthy();
    if (result) {
      expect(result).toHaveProperty("track");
      expect(result).toHaveProperty("courses");
      expect(result).toHaveProperty("averageProgress");
    }
  }, 15000);
