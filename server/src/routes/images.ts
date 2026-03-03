import { Hono } from "hono";

const app = new Hono();

// In-memory image cache: URL → { data, contentType, fetchedAt }
const cache = new Map<string, { data: ArrayBuffer; contentType: string; fetchedAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const IPFS_GATEWAYS = [
  "https://gateway.pinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://cf-ipfs.com/ipfs/",
];

/** Extract IPFS CID from any gateway URL */
function extractIpfsCid(url: string): string | null {
  const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/** Try fetching an image, with IPFS gateway fallbacks */
async function fetchImage(url: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const cid = extractIpfsCid(url);

  // If it's an IPFS URL, try multiple gateways
  if (cid) {
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const res = await fetch(`${gateway}${cid}`, {
          signal: AbortSignal.timeout(10_000),
          headers: { "User-Agent": "PumpOrRug/1.0" },
          redirect: "follow",
        });
        if (res.ok) {
          const contentType = res.headers.get("Content-Type") || "image/png";
          const data = await res.arrayBuffer();
          return { data, contentType };
        }
      } catch {
        // Try next gateway
      }
    }
    return null;
  }

  // Non-IPFS URL — fetch directly
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "PumpOrRug/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("Content-Type") || "image/png";
    const data = await res.arrayBuffer();
    return { data, contentType };
  } catch {
    return null;
  }
}

app.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.text("Missing url param", 400);
  }

  // Check cache
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return new Response(cached.data, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const result = await fetchImage(url);
  if (!result) {
    return c.text("Image fetch failed", 502);
  }

  // Cache it
  cache.set(url, { ...result, fetchedAt: Date.now() });

  // Evict old entries if cache gets too big (>500 images)
  if (cache.size > 500) {
    const oldest = [...cache.entries()]
      .sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)
      .slice(0, 100);
    for (const [key] of oldest) {
      cache.delete(key);
    }
  }

  return new Response(result.data, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=86400",
    },
  });
});

export const imagesRoute = app;
