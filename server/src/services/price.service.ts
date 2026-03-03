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

async function getBagsPrice(mint: string): Promise<number | null> {
  try {
    // bags.fm may have a direct token endpoint; for now re-fetch pools and find
    const pools = await fetchBagsPools(100);
    const pool = pools.find((p) => p.tokenMint === mint);
    return pool?.price ?? null;
  } catch {
    const cached = tokenCacheRepo.getByMint(mint);
    return cached?.price ?? null;
  }
}
