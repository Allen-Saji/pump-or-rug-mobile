#!/usr/bin/env python3
import os
import json
import urllib.parse
import urllib.request

BASE = "https://public-api-v2.bags.fm/api/v1"
SOL_MINT = "So11111111111111111111111111111111111111112"


def get(path, params=None, api_key=None):
    url = f"{BASE}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    headers = {"User-Agent": "PumpOrRug/1.0"}
    if api_key:
        headers["x-api-key"] = api_key
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.getcode(), json.loads(resp.read().decode("utf-8"))


def main():
    api_key = os.getenv("BAGS_API_KEY", "")
    if not api_key:
        raise SystemExit("Set BAGS_API_KEY first")

    code, pools = get("/solana/bags/pools", params={"onlyMigrated": "false"}, api_key=api_key)
    rows = pools.get("response", []) if isinstance(pools, dict) else []
    print(f"pools_status={code} pools_count={len(rows)}")
    if not rows:
        return

    token_mint = rows[0].get("tokenMint")
    print(f"sample_token={token_mint}")

    # Try quote SOL -> token for tiny amount (0.01 SOL = 10_000_000 lamports)
    qparams = {
        "inputMint": SOL_MINT,
        "outputMint": token_mint,
        "amount": "10000000",
        "slippageMode": "manual",
        "slippageBps": "200",
    }
    qcode, quote = get("/trade/quote", params=qparams, api_key=api_key)
    print(f"quote_status={qcode}")
    print("quote_keys=", list(quote.keys()) if isinstance(quote, dict) else type(quote).__name__)


if __name__ == "__main__":
    main()
