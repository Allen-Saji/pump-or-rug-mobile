import { eq, desc, sql, and, gte, lt } from "drizzle-orm";
import { db } from "../db/client";
import { rounds, roundTokens } from "../db/schema";
import type { RoundStatus } from "@pump-or-rug/shared";

export type RoundRow = typeof rounds.$inferSelect;
export type RoundInsert = typeof rounds.$inferInsert;
export type RoundTokenRow = typeof roundTokens.$inferSelect;
export type RoundTokenInsert = typeof roundTokens.$inferInsert;

export const roundRepo = {
  create(round: RoundInsert, tokens: RoundTokenInsert[]) {
    db.transaction(() => {
      db.insert(rounds).values(round).run();
      for (const token of tokens) {
        db.insert(roundTokens).values(token).run();
      }
    });
  },

  getById(id: string): RoundRow | undefined {
    return db.select().from(rounds).where(eq(rounds.id, id)).get();
  },

  getTokensByRoundId(roundId: string): RoundTokenRow[] {
    return db
      .select()
      .from(roundTokens)
      .where(eq(roundTokens.roundId, roundId))
      .all();
  },

  getRecent(limit: number, offset: number): RoundRow[] {
    return db
      .select()
      .from(rounds)
      .orderBy(desc(rounds.opensAt))
      .limit(limit)
      .offset(offset)
      .all();
  },

  getCurrentOpen(): RoundRow | undefined {
    const now = Date.now();
    return db
      .select()
      .from(rounds)
      .where(
        and(eq(rounds.status, "open"), gte(rounds.closesAt, now))
      )
      .orderBy(desc(rounds.opensAt))
      .limit(1)
      .get();
  },

  getByRoundNumber(roundNumber: number): RoundRow | undefined {
    return db
      .select()
      .from(rounds)
      .where(eq(rounds.roundNumber, roundNumber))
      .get();
  },

  getUnsettled(): RoundRow[] {
    const now = Date.now();
    return db
      .select()
      .from(rounds)
      .where(and(eq(rounds.status, "open"), lt(rounds.closesAt, now)))
      .all();
  },

  updateStatus(id: string, status: RoundStatus, settlesAt?: number) {
    const update: Partial<RoundRow> = { status };
    if (settlesAt !== undefined) update.settlesAt = settlesAt;
    db.update(rounds).set(update).where(eq(rounds.id, id)).run();
  },

  updateTokenResult(
    tokenId: string,
    priceAtClose: number,
    priceChangePercent: number,
    result: string
  ) {
    db.update(roundTokens)
      .set({ priceAtClose, priceChangePercent, result })
      .where(eq(roundTokens.id, tokenId))
      .run();
  },

  updatePool(id: string, totalPool: number, totalBets: number) {
    db.update(rounds)
      .set({ totalPool, totalBets })
      .where(eq(rounds.id, id))
      .run();
  },

  getRecentMints(sinceMs: number): string[] {
    const cutoff = Date.now() - sinceMs;
    const rows = db
      .select({ mint: roundTokens.mint })
      .from(roundTokens)
      .innerJoin(rounds, eq(roundTokens.roundId, rounds.id))
      .where(gte(rounds.opensAt, cutoff))
      .all();
    return rows.map((r) => r.mint);
  },

  getMaxRoundNumber(): number {
    const row = db
      .select({ max: sql<number>`COALESCE(MAX(${rounds.roundNumber}), 0)` })
      .from(rounds)
      .get();
    return row?.max ?? 0;
  },
};
