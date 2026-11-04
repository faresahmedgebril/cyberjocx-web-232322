import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/env", () => ({
  ENV: { DATABASE_URL: undefined },
}));

import {
  getDatabase,
  runWithRequestDatabaseScope,
  type RequestDatabaseScope,
} from "./client";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("request-scoped database context", () => {
  it("isolates concurrent async requests from one another", async () => {
    const databaseA = { requestId: "request-a" };
    const databaseB = { requestId: "request-b" };
    const scopeA = {
      getDatabase: vi.fn().mockResolvedValue(databaseA),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as RequestDatabaseScope;
    const scopeB = {
      getDatabase: vi.fn().mockResolvedValue(databaseB),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as RequestDatabaseScope;

    const [resultA, resultB] = await Promise.all([
      runWithRequestDatabaseScope(scopeA, async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return getDatabase();
      }),
      runWithRequestDatabaseScope(scopeB, async () => {
        await Promise.resolve();
        return getDatabase();
      }),
    ]);

    expect(resultA).toBe(databaseA);
    expect(resultB).toBe(databaseB);
    expect(scopeA.getDatabase).toHaveBeenCalledTimes(1);
    expect(scopeB.getDatabase).toHaveBeenCalledTimes(1);
  });

  it("fails closed when Worker mode is missing a request scope", async () => {
    vi.stubEnv("DB_REQUEST_SCOPED", "true");

    await expect(getDatabase()).rejects.toThrow(
      "Request-scoped database context is missing",
    );
  });

  it("returns null for an unconfigured non-Worker database", async () => {
    vi.stubEnv("DB_REQUEST_SCOPED", "false");

    await expect(getDatabase()).resolves.toBeNull();
  });
});
