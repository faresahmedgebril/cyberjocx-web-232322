export type LeaderboardInput = {
  id: number;
  points: number | string;
  [key: string]: unknown;
};

export type RankedLeaderboardEntry<T extends LeaderboardInput> = T & {
  rank: number;
  isCurrentUser: boolean;
};

/**
 * Rank every registered member, including new members with zero XP.
 * Stable input ordering is preserved for equal point totals.
 */
export function rankLeaderboardEntries<T extends LeaderboardInput>(
  rows: T[],
  currentUserId?: number,
): RankedLeaderboardEntry<T>[] {
  return rows.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    isCurrentUser: entry.id === currentUserId,
  }));
}
