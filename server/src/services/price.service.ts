import { fetchBirdeyePrice } from "../external/birdeye.client";
import { computePumpFunPrice } from "../external/pumpfun.client";
import { config } from "../lib/config";
import type { TokenPlatform } from "@pump-or-rug/shared";

export interface TokenPrice {
  mint: string;
  price: number;
}

export const priceService = {
  async getClosePrice(mint: string, platform: TokenPlatform): Promise<number | null> {
    try {
      // Primary for pump.fun tokens: pump.fun live API (free, no rate limit)
      if (platform === "pump.fun") {
        const price = await getPumpFunPrice(mint);
        if (price !== null) return price;
        console.warn(`[price] pump.fun API failed for ${mint}, trying Birdeye`);
      }

      // Fallback / primary for non-pump.fun: Birdeye
      if (config.birdeyeApiKey) {
        const price = await fetchBirdeyePrice(mint);
        if (price !== null) return price;
        console.warn(`[price] Birdeye returned null for ${mint}`);
      }

      // If pump.fun wasn't tried yet (non-pump.fun platform), try it as last resort
      if (platform !== "pump.fun") {
        return await getPumpFunPrice(mint);
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
    return null;
  }
}
