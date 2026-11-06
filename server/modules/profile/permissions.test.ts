import { describe, expect, it } from "vitest";
import { sanitizeProfileUpdate } from "./permissions";

describe("sanitizeProfileUpdate", () => {
  it("preserves normal profile fields but strips memberRank for regular users", () => {
    expect(sanitizeProfileUpdate("user", {
      name: "Fares",
      bio: "Security learner",
      memberRank: "elite",
    })).toEqual({
      name: "Fares",
      bio: "Security learner",
    });
  });

  it("also strips memberRank for instructors", () => {
    expect(sanitizeProfileUpdate("instructor", {
      name: "Instructor",
      memberRank: "mentor",
    })).toEqual({
      name: "Instructor",
    });
  });

  it("allows administrators to update memberRank", () => {
    expect(sanitizeProfileUpdate("admin", {
      name: "Admin",
      memberRank: "elite",
    })).toEqual({
      name: "Admin",
      memberRank: "elite",
    });
  });
});
