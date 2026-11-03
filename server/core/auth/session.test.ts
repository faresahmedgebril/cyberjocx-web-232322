import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("../../db", () => ({
  getDb: mocks.getDb,
  getUserById: vi.fn(),
  upsertUser: vi.fn(),
}));

import { revokeSession } from "./session";

describe("revokeSession", () => {
  beforeEach(() => {
    mocks.getDb.mockReset();
  });

  it("does not silently report success when the database is unavailable", async () => {
    mocks.getDb.mockResolvedValue(null);

    await expect(revokeSession("a-valid-session-token")).rejects.toThrow(
      "Database unavailable; session revocation could not be completed.",
    );
  });

  it("does not require a database when there is no session token", async () => {
    await expect(revokeSession(undefined)).resolves.toBeUndefined();
    expect(mocks.getDb).not.toHaveBeenCalled();
  });
});
