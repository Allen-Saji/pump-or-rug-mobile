import {
  fetchPumpFunCoins,
  computePumpFunPrice,
  computePumpFunLiquidity,
  type PumpFunCoin,
} from "../external/pumpfun.client";
import { fetchBagsPools, type BagsPool } from "../external/bags.client";
import { tokenCacheRepo, type TokenCacheInsert } from "../repositories/token-cache.repo";
import { roundRepo } from "../repositories/round.repo";
import {
  TOKEN_MIN_AGE_MS,
  TOKEN_MAX_AGE_MS,
  TOKEN_MIN_LIQUIDITY,
  TOKEN_MIN_VOLUME,
  TOKEN_COOLDOWN_MS,
  TOKENS_PER_ROUND,
  TOP_N_CANDIDATES,
  STALE_CACHE_THRESHOLD_MS,
} from "../lib/config";
import type { TokenPlatform } from "@pump-or-rug/shared";

export interface CandidateToken {
  mint: string;
  name: string;
  ticker: string;
  platform: TokenPlatform;
  imageUrl?: string;
  price: number;
  liquidity: number;
  marketCap: number;
  activityScore: number;
}

export const tokenService = {
  async refreshCache(platform: TokenPlatform): Promise<number> {
    const now = Date.now();
    let rows: TokenCacheInsert[] = [];

    if (platform === "pump.fun") {
      const coins = await fetchPumpFunCoins(50);
      rows = coins.map((c) => mapPumpFunToCache(c, now));
    } else if (platform === "bags.fm") {
      const pools = await fetchBagsPools(50);
      rows = pools.map((p) => mapBagsToCache(p, now));
    }

    tokenCacheRepo.upsertMany(rows);
    console.log(`[token] Cached ${rows.length} tokens from ${platform}`);
    return rows.length;
  },

  isCacheStale(platform: TokenPlatform): boolean {
    const lastFetch = tokenCacheRepo.getLatestFetchTime(platform);
    if (!lastFetch) return true;
    return Date.now() - lastFetch > STALE_CACHE_THRESHOLD_MS;
  },

  getEligibleTokens(platform: TokenPlatform): CandidateToken[] {
    const now = Date.now();
    const cached = tokenCacheRepo.getByPlatform(platform);
    const recentMints = new Set(roundRepo.getRecentMints(TOKEN_COOLDOWN_MS));

    return cached
      .filter((t) => {
        // Age filter
        if (t.createdTimestamp) {
          const age = now - t.createdTimestamp;
          if (age < TOKEN_MIN_AGE_MS) return false;
          if (TOKEN_MAX_AGE_MS > 0 && age > TOKEN_MAX_AGE_MS) return false;
        }
        // Liquidity filter
        if ((t.liquidity ?? 0) < TOKEN_MIN_LIQUIDITY) return false;
        // Volume filter (skip if not available)
        if (t.volume24h !== null && t.volume24h !== undefined && t.volume24h < TOKEN_MIN_VOLUME) return false;
        // Cooldown: not used in last 24h
        if (recentMints.has(t.mint)) return false;
        return true;
      })
      .map((t) => ({
        mint: t.mint,
        name: t.name,
        ticker: t.ticker,
        platform: t.platform as TokenPlatform,
        imageUrl: t.imageUrl ?? undefined,
        price: t.price,
        liquidity: t.liquidity ?? 0,
        marketCap: t.marketCap ?? 0,
        activityScore: t.activityScore ?? 0,
      }))
      .sort((a, b) => b.activityScore - a.activityScore);
  },

  selectTokensForRound(): CandidateToken[] {
    const pumpTokens = this.getEligibleTokens("pump.fun");
    return weightedRandomPick(pumpTokens, TOKENS_PER_ROUND, TOP_N_CANDIDATES);
  },
};

function weightedRandomPick(
  tokens: CandidateToken[],
  count: number,
  topN: number
): CandidateToken[] {
  const candidates = tokens.slice(0, topN);
  if (candidates.length <= count) return candidates;

  const totalScore = candidates.reduce((s, t) => s + (t.activityScore || 1), 0);
  const picked: CandidateToken[] = [];
  const used = new Set<string>();

  while (picked.length < count && picked.length < candidates.length) {
    let rand = Math.random() * totalScore;
    for (const token of candidates) {
      if (used.has(token.mint)) continue;
      rand -= token.activityScore || 1;
      if (rand <= 0) {
        picked.push(token);
        used.add(token.mint);
        break;
      }
    }
  }

  return picked;
}

function mapPumpFunToCache(coin: PumpFunCoin, now: number): TokenCacheInsert {
  const price = computePumpFunPrice(coin);
  const liquidity = computePumpFunLiquidity(coin);
  // Activity score: recency of trades + reply engagement
  const recencyMs = now - coin.last_trade_timestamp;
  const recencyScore = Math.max(0, 1 - recencyMs / (15 * 60 * 1000)); // 0-1, 1=just traded (15min window)
  const engagementScore = Math.min(coin.reply_count / 100, 1); // 0-1
  const activityScore = recencyScore * 0.7 + engagementScore * 0.3;

  return {
    mint: coin.mint,
    platform: "pump.fun",
    name: coin.name,
    ticker: coin.symbol,
    imageUrl: coin.image_uri ?? null,
    price,
    liquidity,
    marketCap: coin.usd_market_cap,
    volume24h: null,
    createdTimestamp: coin.created_timestamp,
    fetchedAt: now,
    activityScore,
  };
}

function mapBagsToCache(pool: BagsPool, now: number): TokenCacheInsert {
  const createdAt = pool.createdAt ? new Date(pool.createdAt).getTime() : null;
  // Activity score based on volume
  const volumeScore = Math.min(pool.volume24h / 100_000, 1);
  const liquidityScore = Math.min(pool.liquidity / 500_000, 1);
  const activityScore = volumeScore * 0.6 + liquidityScore * 0.4;

  return {
    mint: pool.tokenMint,
    platform: "bags.fm",
    name: pool.tokenName,
    ticker: pool.tokenSymbol,
    imageUrl: pool.tokenImage ?? null,
    price: pool.price,
    liquidity: pool.liquidity,
    marketCap: pool.marketCap,
    volume24h: pool.volume24h,
    createdTimestamp: createdAt,
    fetchedAt: now,
    activityScore,
  };
}

/** Rewrite IPFS gateway URLs to Pinata's reliable gateway */
function rewriteIpfsUrl(url: string | undefined): string | null {
  if (!url) return null;
  // Match any IPFS gateway URL pattern
  const match = url.match(
    /(?:ipfs\.io|cf-ipfs\.com|cloudflare-ipfs\.com|dweb\.link)\/ipfs\/(.+)/
  );
  if (match) {
    return `https://gateway.pinata.cloud/ipfs/${match[1]}`;
  }
  // Handle bafkrei... CID-only style URLs
  const bafMatch = url.match(/\/ipfs\/(baf[a-z0-9]+)/i);
  if (bafMatch) {
    return `https://gateway.pinata.cloud/ipfs/${bafMatch[1]}`;
  }
  return url;
}
