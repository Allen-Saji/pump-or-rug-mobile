import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  privyUserId: text("privy_user_id").notNull().unique(),
  walletAddress: text("wallet_address"),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  points: integer("points").notNull().default(0),
  winStreak: integer("win_streak").notNull().default(0),
  dailyStreak: integer("daily_streak").notNull().default(0),
  totalBets: integer("total_bets").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const rounds = sqliteTable("rounds", {
  id: text("id").primaryKey(),
  roundNumber: integer("round_number").notNull().unique(),
  status: text("status", {
    enum: ["open", "settling", "settled", "cancelled"],
  })
    .notNull()
    .default("open"),
  opensAt: integer("opens_at").notNull(),
  closesAt: integer("closes_at").notNull(),
  settlesAt: integer("settles_at"),
  totalPool: real("total_pool").notNull().default(0),
  totalBets: integer("total_bets").notNull().default(0),
});

export const roundTokens = sqliteTable(
  "round_tokens",
  {
    id: text("id").primaryKey(),
    roundId: text("round_id")
      .notNull()
      .references(() => rounds.id),
    mint: text("mint").notNull(),
    name: text("name").notNull(),
    ticker: text("ticker").notNull(),
    platform: text("platform", {
      enum: ["pump.fun", "bags.fm", "raydium"],
    }).notNull(),
    imageUrl: text("image_url"),
    priceAtOpen: real("price_at_open").notNull(),
    priceAtClose: real("price_at_close"),
    priceChangePercent: real("price_change_percent"),
    liquidity: real("liquidity"),
    marketCap: real("market_cap"),
    result: text("result", {
      enum: ["pump", "rug", "void", "no_score"],
    }),
    onchainRoundId: integer("onchain_round_id"),
  },
  (table) => [
    index("idx_round_tokens_round_id").on(table.roundId),
    index("idx_round_tokens_mint").on(table.mint),
  ]
);

export const bets = sqliteTable(
  "bets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    roundId: text("round_id")
      .notNull()
      .references(() => rounds.id),
    tokenId: text("token_id")
      .notNull()
      .references(() => roundTokens.id),
    side: text("side", { enum: ["pump", "rug"] }).notNull(),
    amount: real("amount").notNull(),
    result: text("result", {
      enum: ["pump", "rug", "void", "no_score"],
    }),
    payout: real("payout"),
    placedAt: integer("placed_at").notNull(),
    txSignature: text("tx_signature"),
    claimTxSignature: text("claim_tx_signature"),
    onchainStatus: text("onchain_status", {
      enum: ["pending", "confirmed", "failed"],
    }).default("pending"),
  },
  (table) => [
    index("idx_bets_user_id").on(table.userId),
    index("idx_bets_round_id").on(table.roundId),
    index("idx_bets_user_round").on(table.userId, table.roundId),
  ]
);

export const tokenCache = sqliteTable(
  "token_cache",
  {
    mint: text("mint").primaryKey(),
    platform: text("platform", {
      enum: ["pump.fun", "bags.fm", "raydium"],
    }).notNull(),
    name: text("name").notNull(),
    ticker: text("ticker").notNull(),
    imageUrl: text("image_url"),
    price: real("price").notNull(),
    liquidity: real("liquidity"),
    marketCap: real("market_cap"),
    volume24h: real("volume_24h"),
    createdTimestamp: integer("created_timestamp"),
    fetchedAt: integer("fetched_at").notNull(),
    activityScore: real("activity_score"),
  },
  (table) => [
    index("idx_token_cache_platform_fetched").on(
      table.platform,
      table.fetchedAt
    ),
  ]
);
