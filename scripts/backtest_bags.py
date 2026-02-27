#!/usr/bin/env python3
"""
Backtest proxy for Bags.fm token universe.

Data sources:
- Bags public pools endpoint: https://public-api-v2.bags.fm/api/v1/solana/bags/pools
- DexScreener token pairs endpoint: https://api.dexscreener.com/latest/dex/tokens/{mint}

This is a proxy backtest for V3 rules (NOT true TWAP settlement), used to validate
whether bags.fm has enough eligible supply and rough pump/rug balance.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

BAGS_POOLS_URL = "https://public-api-v2.bags.fm/api/v1/solana/bags/pools"
DEX_TOKEN_URL = "https://api.dexscreener.com/latest/dex/tokens/{}"

# V3 filters (proxied)
MIN_AGE_H = 0.25  # 15 minutes
MAX_AGE_H = 72.0
MIN_LIQ_USD = 25_000
MIN_VOL_30M_USD = 30_000

# Proxy classification using 6h change
RUG_CHANGE_6H = -20.0
PUMP_CHANGE_6H = 20.0

SOL_PRICE_USD = 140.0


def fetch_json(url: str, retries: int = 2):
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PumpOrRug/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                raw = resp.read().decode("utf-8")
                return json.loads(raw) if raw.strip() else None
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries:
                time.sleep(2 ** (attempt + 1))
                continue
            return None
        except Exception:
            if attempt < retries:
                time.sleep(1)
                continue
            return None
    return None


def get_bags_mints(limit: int = 250):
    data = fetch_json(BAGS_POOLS_URL)
    if not data or not data.get("success"):
        return []
    rows = data.get("response", [])
    mints = []
    for r in rows:
        mint = r.get("tokenMint")
        if mint:
            mints.append(mint)
    return mints[:limit]


def pick_best_solana_pair(pairs: list[dict]):
    sol_pairs = [p for p in pairs if (p.get("chainId") or "").lower() == "solana"]
    if not sol_pairs:
        return None

    def liq(p):
        l = p.get("liquidity") or {}
        return float(l.get("usd") or 0)

    return max(sol_pairs, key=liq)


def classify_pair(pair: dict):
    now_ms = int(time.time() * 1000)
    created_ms = int(pair.get("pairCreatedAt") or 0)
    age_h = (now_ms - created_ms) / 3.6e6 if created_ms > 0 else None

    liquidity = float((pair.get("liquidity") or {}).get("usd") or 0)
    volume = pair.get("volume") or {}
    vol_h1 = float(volume.get("h1") or 0)
    # Proxy: estimate 30m vol as half of 1h volume.
    vol_30m = vol_h1 * 0.5

    change_6h = float((pair.get("priceChange") or {}).get("h6") or 0)

    info = {
        "symbol": ((pair.get("baseToken") or {}).get("symbol") or "?")[:18],
        "mint": (pair.get("baseToken") or {}).get("address") or "",
        "age_h": age_h,
        "liq": liquidity,
        "vol_30m": vol_30m,
        "change_6h": change_6h,
    }

    if age_h is None:
        return "VOID", "missing_age", info
    if age_h < MIN_AGE_H or age_h > MAX_AGE_H:
        return "VOID", "age_out_of_range", info
    if liquidity < MIN_LIQ_USD:
        return "VOID", "low_liq", info
    if vol_30m < MIN_VOL_30M_USD:
        return "VOID", "low_vol", info

    if change_6h <= RUG_CHANGE_6H:
        return "RUG", "down_20pct", info
    if change_6h >= PUMP_CHANGE_6H:
        return "PUMP", "up_20pct", info
    return "NO_SCORE", "between_thresholds", info


def print_bar(label: str, count: int, total: int, width: int = 36):
    pct = (count / total * 100) if total else 0
    fill = int((pct / 100) * width)
    bar = "█" * fill + "░" * (width - fill)
    print(f"  {label:10s} {count:4d} ({pct:5.1f}%)  {bar}")


def main():
    print("=" * 70)
    print("PUMP OR RUG — bags.fm proxy backtest (V3)")
    print(f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"Filters: age {MIN_AGE_H}h–{MAX_AGE_H}h, liq >= ${MIN_LIQ_USD:,}, vol30m >= ${MIN_VOL_30M_USD:,}")
    print("Outcome proxy: 6h change <= -20% => RUG, >= +20% => PUMP")
    print("=" * 70)

    mints = get_bags_mints(limit=250)
    print(f"\n[1/4] Bags pools fetched: {len(mints)} mints")
    if not mints:
        print("No mints fetched. Exiting.")
        return

    rows = []
    for i, mint in enumerate(mints, start=1):
        data = fetch_json(DEX_TOKEN_URL.format(mint))
        if not data or not data.get("pairs"):
            continue
        pair = pick_best_solana_pair(data.get("pairs") or [])
        if not pair:
            continue
        outcome, reason, info = classify_pair(pair)
        info["reason"] = reason
        info["mint"] = mint
        rows.append((outcome, info))
        if i % 25 == 0:
            print(f"  processed {i}/{len(mints)}...")
        time.sleep(0.08)  # be gentle with public API

    print(f"\n[2/4] Usable pair rows: {len(rows)}")
    if not rows:
        print("No usable pairs. Exiting.")
        return

    buckets = {"PUMP": [], "RUG": [], "VOID": [], "NO_SCORE": []}
    for out, info in rows:
        buckets[out].append(info)

    print("\n[3/4] Distribution")
    total = len(rows)
    for k in ["PUMP", "RUG", "VOID", "NO_SCORE"]:
        print_bar(k, len(buckets[k]), total)

    scored = len(buckets["PUMP"]) + len(buckets["RUG"])
    if scored:
        pump_rate = len(buckets["PUMP"]) / scored * 100
        rug_rate = len(buckets["RUG"]) / scored * 100
        print(f"\nScored rounds: {scored}/{total} ({scored/total*100:.1f}%)")
        print(f"PUMP vs RUG (scored only): {pump_rate:.1f}% / {rug_rate:.1f}%")

    print("\nTop VOID reasons:")
    reasons = {}
    for r in buckets["VOID"]:
        reasons[r["reason"]] = reasons.get(r["reason"], 0) + 1
    for reason, n in sorted(reasons.items(), key=lambda x: -x[1])[:6]:
        print(f"  {reason}: {n}")

    print("\n[4/4] Sample eligible tokens")
    eligible = buckets["PUMP"] + buckets["RUG"] + buckets["NO_SCORE"]
    eligible = sorted(eligible, key=lambda x: x["liq"], reverse=True)[:10]
    for r in eligible:
        print(
            f"  {r['symbol']:<12} liq=${r['liq']:>9,.0f} vol30m~=${r['vol_30m']:>8,.0f} "
            f"chg6h={r['change_6h']:>6.1f}% age={r['age_h']:>5.1f}h"
        )

    print("\nLimitations:")
    print("  - Uses DexScreener 6h price change proxy, not true P0/P1 TWAP windows")
    print("  - 30m volume is estimated from 1h volume")
    print("  - No direct bags.fm candle API used in this quick probe")


if __name__ == "__main__":
    main()
