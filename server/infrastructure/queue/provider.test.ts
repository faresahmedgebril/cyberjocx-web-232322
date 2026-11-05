import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../db", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "../../db";
import { DatabaseQueue } from "./provider";

describe("DatabaseQueue", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("sets availableAt to the enqueue timestamp so fresh jobs are immediately claimable", async () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn(() => ({ values }));
    vi.mocked(getDb).mockResolvedValue({ insert } as never);

    const queue = new DatabaseQueue();
    const job = await queue.enqueue("nvd-sync", { source: "test" });

    const inserted = values.mock.calls[0]?.[0] as { createdAt: Date; availableAt: Date };
    expect(inserted.createdAt).toBe(job.createdAt);
    expect(inserted.availableAt).toBe(job.createdAt);
  });
});
