import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../db/client";
import { bets, rounds, roundTokens } from "../db/schema";

export type BetRow = typeof bets.$inferSelect;
export type BetInsert = typeof bets.$inferInsert;

export const betRepo = {
  create(bet: BetInsert) {
    db.insert(bets).values(bet).run();
  },

  getById(id: string): BetRow | undefined {
    return db.select().from(bets).where(eq(bets.id, id)).get();
  },

  getByUserAndRound(userId: string, roundId: string): BetRow[] {
    return db
      .select()
      .from(bets)
      .where(and(eq(bets.userId, userId), eq(bets.roundId, roundId)))
      .all();
  },

  getByUser(userId: string, limit = 50): BetRow[] {
    return db
      .select()
      .from(bets)
      .where(eq(bets.userId, userId))
      .orderBy(desc(bets.placedAt))
      .limit(limit)
      .all();
  },

  getByRound(roundId: string): BetRow[] {
    return db
      .select()
      .from(bets)
      .where(eq(bets.roundId, roundId))
      .all();
  },

  existsForUserAndToken(userId: string, tokenId: string): boolean {
    const row = db
      .select({ id: bets.id })
      .from(bets)
      .where(and(eq(bets.userId, userId), eq(bets.tokenId, tokenId)))
      .limit(1)
      .get();
    return !!row;
  },

  updateResult(betId: string, result: string, payout: number) {
    db.update(bets)
      .set({ result, payout })
      .where(eq(bets.id, betId))
      .run();
  },

  updateOnchainStatus(
    betId: string,
    txSignature: string,
    onchainStatus: string
  ) {
    db.update(bets)
      .set({ txSignature, onchainStatus })
      .where(eq(bets.id, betId))
      .run();
  },

  updateClaimTx(betId: string, claimTxSignature: string) {
    db.update(bets)
      .set({ claimTxSignature, onchainStatus: "confirmed" })
      .where(eq(bets.id, betId))
      .run();
  },

  getPoolsByToken(
    roundId: string
  ): { tokenId: string; side: string; pool: number }[] {
    return db
      .select({
        tokenId: bets.tokenId,
        side: bets.side,
        pool: sql<number>`COALESCE(SUM(${bets.amount}), 0)`,
      })
      .from(bets)
      .where(eq(bets.roundId, roundId))
      .groupBy(bets.tokenId, bets.side)
      .all();
  },

  updateManyResults(
    updates: { id: string; result: string; payout: number }[]
  ) {
    db.transaction(() => {
      for (const u of updates) {
        db.update(bets)
          .set({ result: u.result, payout: u.payout })
          .where(eq(bets.id, u.id))
          .run();
      }
    });
  },
};
