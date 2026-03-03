import { userRepo } from "../repositories/user.repo";
import type { LeaderboardEntry, LeaderboardPeriod } from "@pump-or-rug/shared";

export const leaderboardService = {
  getLeaderboard(
    period: LeaderboardPeriod,
    limit = 20,
    currentUserId?: string
  ): LeaderboardEntry[] {
    const rows = userRepo.getLeaderboard(period, limit);

    return rows.map((r) => ({
      rank: r.rank,
      userId: r.id,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl ?? undefined,
      points: r.points,
      winStreak: r.winStreak,
      isCurrentUser: r.id === currentUserId,
    }));
  },
};
