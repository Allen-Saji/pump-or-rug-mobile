#!/usr/bin/env python3
"""
Bags-native V3 probe (no DexScreener).

Uses ONLY Bags API endpoints:
- /solana/bags/pools
- /trade/quote
- /token-launch/lifetime-fees

This is not a full historical backtest (Bags public API doesn't expose OHLCV/TWAP history
in this script). It is a V3 *eligibility + market quality probe* to validate if hourly
selection is feasible on bags.fm.
"""

from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass

BASE = "https://public-api-v2.bags.fm/api/v1"
SOL_MINT = "So11111111111111111111111111111111111111112"

# Probe constants
SMALL_SOL_LAMPORTS = 10_000_000    # 0.01 SOL
LARGE_SOL_LAMPORTS = 100_000_000   # 0.1 SOL
MAX_LARGE_PRICE_IMPACT_PCT = 15.0
MIN_LIFETIME_FEES_LAMPORTS = 500_000_000  # 0.5 SOL proxy activity floor
SAMPLE_LIMIT = 300


@dataclass
class TokenProbe:
    mint: str
    small_ok: bool
    large_ok: bool
    large_price_impact_pct: float | None
    lifetime_fees_lamports: int | None
    eligible: bool
    reason: str


def api_get(path: str, params: dict | None = None, api_key: str = ""):
    url = f"{BASE}{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "PumpOrRug/1.0",
            "x-api-key": api_key,
        },
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def quote(api_key: str, output_mint: str, amount_lamports: int):
    try:
        res = api_get(
            "/trade/quote",
            {
                "inputMint": SOL_MINT,
                "outputMint": output_mint,
                "amount": str(amount_lamports),
                "slippageMode": "manual",
                "slippageBps": "200",
            },
            api_key,
        )
        if not res.get("success"):
            return False, None
        payload = res.get("response") or {}
        # API may return priceImpactPct or priceImpact depending on route
        pip = payload.get("priceImpactPct", payload.get("priceImpact"))
        try:
            pip = float(pip) if pip is not None else None
        except Exception:
            pip = None
        return True, pip
    except Exception:
        return False, None


def lifetime_fees(api_key: str, mint: str):
    try:
        res = api_get("/token-launch/lifetime-fees", {"tokenMint": mint}, api_key)
        if not res.get("success"):
            return None
        v = res.get("response")
        return int(v) if v is not None else None
    except Exception:
        return None


def probe_token(api_key: str, mint: str) -> TokenProbe:
    small_ok, _ = quote(api_key, mint, SMALL_SOL_LAMPORTS)
    if not small_ok:
        return TokenProbe(mint, False, False, None, None, False, "quote_fail_small")

    large_ok, large_impact = quote(api_key, mint, LARGE_SOL_LAMPORTS)
    if not large_ok:
        return TokenProbe(mint, True, False, None, None, False, "quote_fail_large")

    fees = lifetime_fees(api_key, mint)
    if fees is None:
        return TokenProbe(mint, True, True, large_impact, None, False, "fees_unavailable")

    if large_impact is not None and large_impact > MAX_LARGE_PRICE_IMPACT_PCT:
        return TokenProbe(mint, True, True, large_impact, fees, False, "high_price_impact")

    if fees < MIN_LIFETIME_FEES_LAMPORTS:
        return TokenProbe(mint, True, True, large_impact, fees, False, "low_lifetime_fees")

    return TokenProbe(mint, True, True, large_impact, fees, True, "eligible")


def main():
    api_key = os.getenv("BAGS_API_KEY", "")
    if not api_key:
        raise SystemExit("Set BAGS_API_KEY env var")

    pools = api_get("/solana/bags/pools", {"onlyMigrated": "false"}, api_key)
    mints = [r.get("tokenMint") for r in (pools.get("response") or []) if r.get("tokenMint")]
    mints = mints[:SAMPLE_LIMIT]

    print(f"Bags pools loaded: {len(mints)} sampled (limit={SAMPLE_LIMIT})")

    out: list[TokenProbe] = []
    reason_counts: dict[str, int] = {}

    for i, mint in enumerate(mints, start=1):
        p = probe_token(api_key, mint)
        out.append(p)
        reason_counts[p.reason] = reason_counts.get(p.reason, 0) + 1
        if i % 25 == 0:
            print(f"  processed {i}/{len(mints)}")
        time.sleep(0.04)

    eligible = [x for x in out if x.eligible]

    print("\n=== Bags-native V3 selection probe ===")
    print(f"sampled: {len(out)}")
    print(f"eligible: {len(eligible)} ({(len(eligible)/len(out)*100 if out else 0):.1f}%)")
    print("reasons:")
    for k, v in sorted(reason_counts.items(), key=lambda kv: -kv[1])[:10]:
        print(f"  {k}: {v}")

    # Feasibility estimate for 2 picks/hour from bags.fm (336/week)
    weekly_need = 2 * 24 * 7
    print(f"\nNeed for bags.fm lane: {weekly_need}/week tokens")
    if len(eligible) >= weekly_need:
        print("status: OK in sampled set")
    elif len(eligible) >= 180:
        print("status: borderline (needs rolling cache + dedupe window tuning)")
    else:
        print("status: tight (consider lowering proxy gates or combining with fresh-feed strategy)")

    print("\nTop eligible sample:")
    top = sorted(
        eligible,
        key=lambda x: (x.lifetime_fees_lamports or 0, -(x.large_price_impact_pct or 9999)),
        reverse=True,
    )[:12]
    for r in top:
        fee_sol = (r.lifetime_fees_lamports or 0) / 1e9
        print(
            f"  {r.mint[:10]}... impact(0.1SOL)={r.large_price_impact_pct if r.large_price_impact_pct is not None else 'n/a'}%"
            f" lifetimeFees={fee_sol:.2f} SOL"
        )


if __name__ == "__main__":
    main()
