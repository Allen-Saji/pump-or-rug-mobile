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

export async function fetchBagsPools(_limit = 50): Promise<BagsPool[]> {
  // bags.fm v2 API only returns pool keys (tokenMint, dbcPoolKey, dbcConfigKey)
  // without price/volume/name/image data. Disabled until they add a token data endpoint.
  // TODO: re-enable when bags.fm API provides token metadata + market data
  console.log("[bags] Skipped — API does not provide token market data yet");
  return [];
}
