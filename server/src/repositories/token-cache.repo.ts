import { eq, and, gte, sql } from "drizzle-orm";
import { db } from "../db/client";
import { tokenCache } from "../db/schema";
import type { TokenPlatform } from "@pump-or-rug/shared";

export type TokenCacheRow = typeof tokenCache.$inferSelect;
export type TokenCacheInsert = typeof tokenCache.$inferInsert;

export const tokenCacheRepo = {
  upsertMany(rows: TokenCacheInsert[]) {
    if (rows.length === 0) return;
    for (const row of rows) {
      db.insert(tokenCache)
        .values(row)
        .onConflictDoUpdate({
          target: tokenCache.mint,
          set: {
            name: row.name,
            ticker: row.ticker,
            imageUrl: row.imageUrl,
            price: row.price,
            liquidity: row.liquidity,
            marketCap: row.marketCap,
            volume24h: row.volume24h,
            fetchedAt: row.fetchedAt,
            activityScore: row.activityScore,
          },
        })
        .run();
    }
  },

  getByPlatform(platform: TokenPlatform): TokenCacheRow[] {
    return db
      .select()
      .from(tokenCache)
      .where(eq(tokenCache.platform, platform))
      .all();
  },

  getAll(): TokenCacheRow[] {
    return db.select().from(tokenCache).all();
  },

  getLatestFetchTime(platform: TokenPlatform): number | null {
    const row = db
      .select({ maxFetched: sql<number>`MAX(${tokenCache.fetchedAt})` })
      .from(tokenCache)
      .where(eq(tokenCache.platform, platform))
      .get();
    return row?.maxFetched ?? null;
  },

  getByMint(mint: string): TokenCacheRow | undefined {
    return db
      .select()
      .from(tokenCache)
      .where(eq(tokenCache.mint, mint))
      .get();
  },

  deleteStale(olderThanMs: number) {
    const cutoff = Date.now() - olderThanMs;
    db.delete(tokenCache).where(sql`${tokenCache.fetchedAt} < ${cutoff}`).run();
  },
};
