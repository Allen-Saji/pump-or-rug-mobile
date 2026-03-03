import { fetchBirdeyePrice } from "../external/birdeye.client";
import { computePumpFunPrice } from "../external/pumpfun.client";
import { tokenCacheRepo } from "../repositories/token-cache.repo";
import { config } from "../lib/config";
import type { TokenPlatform } from "@pump-or-rug/shared";

export interface TokenPrice {
  mint: string;
  price: number;
}

export const priceService = {
  async getClosePrice(mint: string, _platform: TokenPlatform): Promise<number | null> {
    try {
      // Primary: Birdeye (works for any Solana token)
      if (config.birdeyeApiKey) {
        const price = await fetchBirdeyePrice(mint);
        if (price !== null) return price;
        console.warn(`[price] Birdeye returned null for ${mint}, trying fallback`);
      }

      // Fallback: pump.fun direct API
      return await getPumpFunPrice(mint);
    } catch (err) {
      console.error(`[price] Failed to get close price for ${mint}:`, err);
      // Last resort: cached price
      const cached = tokenCacheRepo.getByMint(mint);
      return cached?.price ?? null;
    }
  },

  async getClosePrices(
    tokens: { mint: string; platform: TokenPlatform }[]
  ): Promise<Map<string, number | null>> {
    const results = new Map<string, number | null>();
    // Fetch sequentially to be kind to Birdeye free tier rate limits
    for (const t of tokens) {
      const price = await this.getClosePrice(t.mint, t.platform);
      results.set(t.mint, price);
    }
    return results;
  },
};

async function getPumpFunPrice(mint: string): Promise<number | null> {
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
    const cached = tokenCacheRepo.getByMint(mint);
    return cached?.price ?? null;
  }
}
