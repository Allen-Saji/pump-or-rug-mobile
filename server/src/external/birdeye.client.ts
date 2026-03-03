import { config, BIRDEYE_API_BASE } from "../lib/config";

/**
 * Fetch current price for a Solana token via Birdeye.
 * Uses the /defi/price endpoint (1 credit per call).
 */
export async function fetchBirdeyePrice(mint: string): Promise<number | null> {
  if (!config.birdeyeApiKey) {
    console.warn("[birdeye] No BIRDEYE_API_KEY set, skipping");
    return null;
  }

  try {
    const url = `${BIRDEYE_API_BASE}/defi/price?address=${mint}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": config.birdeyeApiKey,
        "x-chain": "solana",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`[birdeye] HTTP ${res.status} for ${mint}`);
      return null;
    }

    const data = await res.json();
    if (!data?.success) return null;

    return data.data?.value ?? null;
  } catch (err) {
    console.error(`[birdeye] Price fetch failed for ${mint}:`, err);
    return null;
  }
}
