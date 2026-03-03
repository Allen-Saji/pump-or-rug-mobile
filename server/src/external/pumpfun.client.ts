import { PUMPFUN_API_BASE } from "../lib/config";
import { ExternalApiError } from "../lib/errors";

export interface PumpFunCoin {
  mint: string;
  name: string;
  symbol: string;
  image_uri: string;
  market_cap: number;
  usd_market_cap: number;
  virtual_sol_reserves: number;
  virtual_token_reserves: number;
  total_supply: number;
  created_timestamp: number;
  last_trade_timestamp: number;
  reply_count: number;
}

export async function fetchPumpFunCoins(
  limit = 50,
  sortBy = "last_trade_timestamp"
): Promise<PumpFunCoin[]> {
  try {
    const url = new URL(`${PUMPFUN_API_BASE}/coins`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("offset", "0");
    url.searchParams.set("sort", sortBy);
    url.searchParams.set("order", "DESC");
    url.searchParams.set("includeNsfw", "false");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new ExternalApiError("pump.fun", `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ExternalApiError) throw err;
    console.error("[pumpfun] Fetch failed:", err);
    throw new ExternalApiError(
      "pump.fun",
      err instanceof Error ? err.message : "unknown"
    );
  }
}

export function computePumpFunPrice(coin: PumpFunCoin): number {
  if (coin.virtual_token_reserves === 0) return 0;
  return coin.virtual_sol_reserves / coin.virtual_token_reserves;
}

export function computePumpFunLiquidity(coin: PumpFunCoin): number {
  // Approximate USD liquidity from market cap (pump.fun provides usd_market_cap)
  return coin.usd_market_cap * 0.1; // ~10% of mcap as rough liquidity estimate
}
