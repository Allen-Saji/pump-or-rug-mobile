export const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl:
    process.env.DATABASE_URL ||
    (process.env.FLY_APP_NAME ? "/data/pump-or-rug.db" : "./data/pump-or-rug.db"),
  bagsApiKey: process.env.BAGS_API_KEY || "",
  birdeyeApiKey: process.env.BIRDEYE_API_KEY || "",
  privyAppId: process.env.PRIVY_APP_ID || "",
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
  programId:
    process.env.PROGRAM_ID ||
    "8v3eum4thAGnRRYKK34xXvm9bPTaz5ydA3GzfTxSKjbD",
  resolverKeypairPath:
    process.env.RESOLVER_KEYPAIR_PATH || "~/.config/solana/id.json",
} as const;

// Round lifecycle
export const ROUND_DURATION_MS = 60 * 60 * 1000; // 1 hour
export const SETTLEMENT_DELAY_MS = 5 * 60 * 1000; // 5 min after close
export const TOKEN_CACHE_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 min
export const STALE_CACHE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

// Token selection
export const TOKEN_MIN_AGE_MS = 5 * 60 * 1000; // 5 min
export const TOKEN_MAX_AGE_MS = 0; // disabled — age filter via activity score instead
export const TOKEN_MIN_LIQUIDITY = 5_000; // $5k
export const TOKEN_MIN_VOLUME = 0; // disabled for now (pump.fun doesn't provide volume)
export const TOKEN_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h reuse cooldown
export const TOKENS_PER_PLATFORM = 2;
export const TOP_N_CANDIDATES = 5;

// Result thresholds
export const PUMP_THRESHOLD = 10; // >=10% = pump
export const RUG_THRESHOLD = -10; // <=-10% = rug

// Points
export const POINTS_WIN = 5;
export const POINTS_LOSS = -3;
export const POINTS_STREAK_BONUS = 2; // per consecutive win (stacks)
export const POINTS_PERFECT_ROUND_MULTIPLIER = 2; // all calls correct in a round
export const POINTS_RUG_SNIPER_BONUS = 3; // correctly called a >25% rug
export const RUG_SNIPER_THRESHOLD = -25; // % drop to qualify for rug sniper

// External APIs
export const PUMPFUN_API_BASE = "https://frontend-api-v3.pump.fun";
export const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";
export const BIRDEYE_API_BASE = "https://public-api.birdeye.so";
