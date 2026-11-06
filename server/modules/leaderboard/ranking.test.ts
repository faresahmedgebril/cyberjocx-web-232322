import { describe, expect, it } from "vitest";
import { rankLeaderboardEntries } from "./ranking";

describe("rankLeaderboardEntries", () => {
  it("keeps new registered users with zero XP in the leaderboard", () => {
    const entries = rankLeaderboardEntries([
      { id: 3, name: "New member", points: 0 },
      { id: 2, name: "Active member", points: 120 },
    ], 3);

    expect(entries).toEqual([
      { id: 3, name: "New member", points: 0, rank: 1, isCurrentUser: true },
      { id: 2, name: "Active member", points: 120, rank: 2, isCurrentUser: false },
    ]);
  });

  it("preserves the database order for equal point totals", () => {
    const entries = rankLeaderboardEntries([
      { id: 8, points: 50 },
      { id: 4, points: 50 },
    ]);

    expect(entries.map(entry => entry.id)).toEqual([8, 4]);
    expect(entries.map(entry => entry.rank)).toEqual([1, 2]);
  });
});
