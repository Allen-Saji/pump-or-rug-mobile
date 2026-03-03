import { eq, desc, sql, gte, and } from "drizzle-orm";
import { db } from "../db/client";
import { users, bets } from "../db/schema";

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;

export const userRepo = {
  create(user: UserInsert) {
    db.insert(users).values(user).run();
  },

  getById(id: string): UserRow | undefined {
    return db.select().from(users).where(eq(users.id, id)).get();
  },

  getByPrivyUserId(privyUserId: string): UserRow | undefined {
    return db
      .select()
      .from(users)
      .where(eq(users.privyUserId, privyUserId))
      .get();
  },

  upsert(user: UserInsert): UserRow {
    db.insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.privyUserId,
        set: {
          walletAddress: user.walletAddress,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      })
      .run();
    return db
      .select()
      .from(users)
      .where(eq(users.privyUserId, user.privyUserId))
      .get()!;
  },

  updateStats(
    id: string,
    stats: {
      points?: number;
      winStreak?: number;
      totalBets?: number;
      totalWins?: number;
    }
  ) {
    db.update(users).set(stats).where(eq(users.id, id)).run();
  },

  incrementStats(
    id: string,
    deltas: { points: number; wins: number; bets: number; winStreak: number }
  ) {
    db.update(users)
      .set({
        points: sql`${users.points} + ${deltas.points}`,
        totalWins: sql`${users.totalWins} + ${deltas.wins}`,
        totalBets: sql`${users.totalBets} + ${deltas.bets}`,
        winStreak: deltas.winStreak,
      })
      .where(eq(users.id, id))
      .run();
  },

  getLeaderboard(
    period: string,
    limit: number
  ): (UserRow & { rank: number })[] {
    let sinceMs: number;
    switch (period) {
      case "daily":
        sinceMs = Date.now() - 24 * 60 * 60 * 1000;
        break;
      case "weekly":
        sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
        break;
      case "season":
        sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        sinceMs = 0;
    }

    // For all-time, just rank by points directly
    if (sinceMs === 0) {
      const rows = db
        .select()
        .from(users)
        .orderBy(desc(users.points))
        .limit(limit)
        .all();
      return rows.map((r, i) => ({ ...r, rank: i + 1 }));
    }

    // For period-based, sum payout from bets in the period
    const rows = db
      .select({
        id: users.id,
        privyUserId: users.privyUserId,
        walletAddress: users.walletAddress,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        points: users.points,
        winStreak: users.winStreak,
        dailyStreak: users.dailyStreak,
        totalBets: users.totalBets,
        totalWins: users.totalWins,
        createdAt: users.createdAt,
        periodPoints: sql<number>`COALESCE(SUM(${bets.payout}), 0)`,
      })
      .from(users)
      .leftJoin(
        bets,
        and(eq(users.id, bets.userId), gte(bets.placedAt, sinceMs))
      )
      .groupBy(users.id)
      .orderBy(desc(sql`periodPoints`))
      .limit(limit)
      .all();

    return rows.map((r, i) => ({
      id: r.id,
      privyUserId: r.privyUserId,
      walletAddress: r.walletAddress,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      points: r.points,
      winStreak: r.winStreak,
      dailyStreak: r.dailyStreak,
      totalBets: r.totalBets,
      totalWins: r.totalWins,
      createdAt: r.createdAt,
      rank: i + 1,
    }));
  },
};
