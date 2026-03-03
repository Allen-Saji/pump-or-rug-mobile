const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

/** Proxy an image URL through our server to avoid IPFS gateway issues on mobile */
export function proxyImageUrl(url: string): string {
  // Direct URLs (coingecko, etc.) that work fine — skip proxy
  if (!url.includes("ipfs")) {
    return url;
  }
  return `${BASE_URL}/api/images?url=${encodeURIComponent(url)}`;
}
