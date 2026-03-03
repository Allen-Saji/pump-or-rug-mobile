import { fetchPumpFunCoins, computePumpFunPrice } from "../external/pumpfun.client";
import { fetchBagsPools } from "../external/bags.client";
import { tokenCacheRepo } from "../repositories/token-cache.repo";
import type { TokenPlatform } from "@pump-or-rug/shared";

export interface TokenPrice {
  mint: string;
  price: number;
}

export const priceService = {
  async getClosePrice(mint: string, platform: TokenPlatform): Promise<number | null> {
    try {
      if (platform === "pump.fun") {
        return await getPumpFunPrice(mint);
      } else if (platform === "bags.fm") {
        return await getBagsPrice(mint);
      }
      return null;
    } catch (err) {
      console.error(`[price] Failed to get close price for ${mint}:`, err);
      return null;
    }
  },

  async getClosePrices(
    tokens: { mint: string; platform: TokenPlatform }[]
  ): Promise<Map<string, number | null>> {
    const results = new Map<string, number | null>();
    // Fetch in parallel
    await Promise.all(
      tokens.map(async (t) => {
        const price = await this.getClosePrice(t.mint, t.platform);
        results.set(t.mint, price);
      })
    );
    return results;
  },
};

async function getPumpFunPrice(mint: string): Promise<number | null> {
  // Try to fetch the specific coin
  try {
    const res = await fetch(
      `https://frontend-api-v3.pump.fun/coins/${mint}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!res.ok) return null;
    const coin = await res.json();
    return computePumpFunPrice(coin);
  } catch {
    // Fallback to cached price
    const cached = tokenCacheRepo.getByMint(mint);
    return cached?.price ?? null;
  }
}

// In-memory cache for bags pools to avoid re-fetching on every price lookup
let bagsPoolsCache: { pools: Awaited<ReturnType<typeof fetchBagsPools>>; fetchedAt: number } | null = null;
const BAGS_CACHE_TTL_MS = 60_000; // 1 minute

async function getBagsPoolsCached() {
  const now = Date.now();
  if (bagsPoolsCache && now - bagsPoolsCache.fetchedAt < BAGS_CACHE_TTL_MS) {
    return bagsPoolsCache.pools;
  }
  const pools = await fetchBagsPools(100);
  bagsPoolsCache = { pools, fetchedAt: now };
  return pools;
}

async function getBagsPrice(mint: string): Promise<number | null> {
  try {
    const pools = await getBagsPoolsCached();
    const pool = pools.find((p) => p.tokenMint === mint);
    return pool?.price ?? null;
  } catch {
    const cached = tokenCacheRepo.getByMint(mint);
    return cached?.price ?? null;
  }
}
