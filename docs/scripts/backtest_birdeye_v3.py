#!/usr/bin/env python3
"""
Birdeye backtest (V3 price windows) for Pump or Rug.

Uses Birdeye historical price endpoint to compute:
- P0 TWAP: minutes 2..10 after token creation
- P1 TWAP: last 15 minutes before +6h settlement

NOTE: This script currently classifies by PRICE ONLY.
Liquidity checks (L0/L1) should be integrated in a next pass.
"""

from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

PUMPFUN_API = "https://frontend-api-v3.pump.fun"
BIRDEYE_BASE = "https://public-api.birdeye.so"

PUMP_RATIO = 1.20
RUG_RATIO = 0.80


def now_ts() -> int:
    return int(time.time())


def get_json(url: str, headers: dict | None = None, retries: int = 4):
    headers = headers or {"User-Agent": "PumpOrRug/1.0"}
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=25) as resp:
                return resp.getcode(), dict(resp.headers), json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < retries - 1:
                reset = e.headers.get("x-ratelimit-reset")
                if reset and reset.isdigit():
                    wait = max(1, int(reset) - now_ts())
                else:
                    wait = 2 ** (attempt + 1)
                time.sleep(min(wait, 12))
                continue
            return e.code, dict(e.headers), None
        except Exception:
            if attempt < retries - 1:
                time.sleep(1.5)
                continue
            return 0, {}, None
    return 0, {}, None


def fetch_pump_tokens(limit=220):
    out = []
    offset = 0
    page = 50
    while len(out) < limit:
        url = (
            f"{PUMPFUN_API}/coins?limit={page}&offset={offset}"
            f"&sort=last_trade_timestamp&order=DESC&includeNsfw=false"
        )
        status, _, data = get_json(url)
        if status != 200 or not isinstance(data, list) or not data:
            break
        out.extend(data)
        offset += page
        time.sleep(0.12)
    return out[:limit]


def birdeye_history_prices(api_key: str, mint: str, t_from: int, t_to: int, interval="1m"):
    params = urllib.parse.urlencode(
        {
            "address": mint,
            "address_type": "token",
            "type": interval,
            "time_from": t_from,
            "time_to": t_to,
        }
    )
    url = f"{BIRDEYE_BASE}/defi/history_price?{params}"
    headers = {
        "User-Agent": "PumpOrRug/1.0",
        "X-API-KEY": api_key,
        "x-chain": "solana",
    }
    status, _, data = get_json(url, headers=headers)
    if status != 200 or not data or not data.get("success"):
        return []
    items = (data.get("data") or {}).get("items") or []
    return [float(x.get("value")) for x in items if x.get("value") is not None]


def mean(xs):
    return sum(xs) / len(xs) if xs else None


def classify_ratio(ratio: float):
    if ratio <= RUG_RATIO:
        return "RUG"
    if ratio >= PUMP_RATIO:
        return "PUMP"
    return "NO_SCORE"


def main():
    api_key = os.getenv("BIRDEYE_API_KEY", "")
    if not api_key:
        raise SystemExit("Set BIRDEYE_API_KEY env var")

    print("=" * 72)
    print("PUMP OR RUG — Birdeye price-window backtest (V3 proxy)")
    print("Using history_price endpoint + pump.fun token universe")
    print("Classification: PRICE ONLY (liquidity checks not included in this pass)")
    print("=" * 72)

    tokens_raw = fetch_pump_tokens(limit=220)
    # de-dup by mint
    seen = set()
    tokens = []
    for t in tokens_raw:
        m = t.get("mint")
        if not m or m in seen:
            continue
        seen.add(m)
        tokens.append(t)

    now = int(time.time() * 1000)

    # settleable and recent enough to be relevant
    candidates = []
    for t in tokens:
        created_ms = int(t.get("created_timestamp") or 0)
        if not created_ms:
            continue
        age_h = (now - created_ms) / 3.6e6
        if 6 <= age_h <= 72:
            candidates.append(t)

    print(f"tokens fetched={len(tokens)} candidates(6h-72h)={len(candidates)}")

    # cap for API usage
    candidates = candidates[:35]

    out = {"PUMP": 0, "RUG": 0, "NO_SCORE": 0, "VOID": 0}
    rows = []

    for i, t in enumerate(candidates, start=1):
        mint = t.get("mint")
        symbol = (t.get("symbol") or "?")[:14]
        created_s = int((t.get("created_timestamp") or 0) / 1000)
        settle_s = created_s + 6 * 3600

        # P0 window: creation+2m .. +10m
        p0_vals = birdeye_history_prices(api_key, mint, created_s + 120, created_s + 600, "1m")
        # P1 window: settle-15m .. settle
        p1_vals = birdeye_history_prices(api_key, mint, settle_s - 900, settle_s, "1m")

        p0 = mean(p0_vals)
        p1 = mean(p1_vals)

        if not p0 or not p1:
            out["VOID"] += 1
            rows.append((symbol, "VOID", None, len(p0_vals), len(p1_vals)))
        else:
            ratio = p1 / p0
            cls = classify_ratio(ratio)
            out[cls] += 1
            rows.append((symbol, cls, ratio, len(p0_vals), len(p1_vals)))

        if i % 10 == 0:
            print(f"  processed {i}/{len(candidates)}")
        time.sleep(0.15)

    total = len(candidates)
    print("\nDistribution:")
    for k in ["PUMP", "RUG", "NO_SCORE", "VOID"]:
        v = out[k]
        pct = (v / total * 100) if total else 0
        print(f"  {k:8s} {v:3d} ({pct:5.1f}%)")

    scored = out["PUMP"] + out["RUG"]
    if scored:
        print(f"\nScored only: PUMP={out['PUMP']/scored*100:.1f}% RUG={out['RUG']/scored*100:.1f}%")

    print("\nSample rows:")
    for r in rows[:12]:
        sym, cls, ratio, n0, n1 = r
        rs = f"{ratio:.3f}" if ratio is not None else "n/a"
        print(f"  {sym:14s} {cls:8s} ratio={rs:>6s} p0pts={n0:2d} p1pts={n1:2d}")


if __name__ == "__main__":
    main()
