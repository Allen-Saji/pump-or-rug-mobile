import { BAGS_API_BASE } from "../lib/config";
import { config } from "../lib/config";
import { ExternalApiError } from "../lib/errors";

export interface BagsPool {
  poolAddress: string;
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  tokenImage?: string;
  price: number;
  liquidity: number;
  marketCap: number;
  volume24h: number;
  createdAt: string;
}

export async function fetchBagsPools(limit = 50): Promise<BagsPool[]> {
  if (!config.bagsApiKey) {
    console.warn("[bags] No BAGS_API_KEY set, skipping");
    return [];
  }

  try {
    const url = new URL(`${BAGS_API_BASE}/solana/bags/pools`);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("sort", "volume24h");
    url.searchParams.set("order", "desc");

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-API-Key": config.bagsApiKey,
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new ExternalApiError("bags.fm", `HTTP ${res.status}`);
    }

    const data = await res.json();
    // bags.fm may return { pools: [...] } or a direct array
    return Array.isArray(data) ? data : data.pools ?? [];
  } catch (err) {
    if (err instanceof ExternalApiError) throw err;
    console.error("[bags] Fetch failed:", err);
    throw new ExternalApiError(
      "bags.fm",
      err instanceof Error ? err.message : "unknown"
    );
  }
}
