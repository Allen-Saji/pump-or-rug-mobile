#!/usr/bin/env python3
"""
Backtest Pump or Rug settlement logic against pump.fun API data.

Strategy: Pull tokens via multiple sort orders to get a diverse sample
across age ranges, then apply settlement classification.

V3: Variable staking model, ±20% settlement thresholds, +10/-3 points.
"""

import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

PUMPFUN_API = "https://frontend-api-v3.pump.fun"
SOL_PRICE_USD = 140.0

# Settlement thresholds (GAME_RULES V3)
VOID_MIN_LIQ = 25_000
VOID_MIN_VOL = 50_000
RUG_PRICE_RATIO = 0.80       # P1 <= 0.80*P0 (20%+ down)
RUG_LIQ_RATIO = 0.30         # L1 <= 0.30*L0 (70%+ drain)
PUMP_PRICE_RATIO = 1.20      # P1 >= 1.20*P0 (20%+ up)
PUMP_LIQ_RATIO = 0.60        # L1 >= 0.60*L0
ELIGIBLE_MIN_LIQ = 25_000

# ATH proxy for snapshot-only backtest (no true P0/P1 candles available)
# Treat current/ATH >= 0.80 as PUMP-like retained strength
PUMP_PRICE_RATIO_ATH = 0.80

# Scoring (V3)
SCORE_CORRECT = 10
SCORE_WRONG = -3
SCORE_BONUS_3OF4 = 5
SCORE_BONUS_PERFECT = 15

# Staking / payout (V3)
STAKE_MIN_SOL = 0.01
STAKE_MAX_SOL = 3.0
PAYOUT_MULTIPLIER = 1.8
RAKE_ON_WINNINGS = 0.05
EFFECTIVE_PAYOUT_MULTIPLIER = PAYOUT_MULTIPLIER - (PAYOUT_MULTIPLIER - 1.0) * RAKE_ON_WINNINGS


def fetch_json(url, retries=2):
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "PumpOrRug/1.0"})
            with urllib.request.urlopen(req, timeout=20) as resp:
                raw = resp.read().decode()
                return json.loads(raw) if raw.strip() else None
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(2 ** (attempt + 1))
            else:
                return None
        except:
            time.sleep(1)
    return None


def fetch_tokens(sort, order, limit=200):
    """Fetch tokens with given sort, paginating."""
    tokens = []
    offset = 0
    batch = 50
    while len(tokens) < limit:
        url = (f"{PUMPFUN_API}/coins?limit={batch}&offset={offset}"
               f"&sort={sort}&order={order}&includeNsfw=false")
        data = fetch_json(url)
        if not data or len(data) == 0:
            break
        tokens.extend(data)
        offset += batch
        time.sleep(0.25)
    return tokens[:limit]


def sol_to_usd(lamports):
    return (lamports / 1e9) * SOL_PRICE_USD


def classify(t):
    """Classify a token using pump.fun snapshot data (V3 thresholds, proxy mode)."""
    mcap = t.get("usd_market_cap", 0) or 0
    ath = t.get("ath_market_cap", 0) or 0
    real_sol = t.get("real_sol_reserves", 0) or 0
    complete = t.get("complete", False)
    created = t.get("created_timestamp", 0)
    last_trade = t.get("last_trade_timestamp", 0)

    now_ms = int(time.time() * 1000)
    age_h = (now_ms - created) / 3.6e6 if created > 0 else 0
    idle_h = (now_ms - last_trade) / 3.6e6 if last_trade > 0 else 999

    liq_usd = sol_to_usd(real_sol)
    # For graduated tokens, real_sol_reserves is 0 (moved to DEX)
    if complete and liq_usd < 1000:
        liq_usd = mcap * 0.1  # rough proxy

    # Price ratio: current vs ATH
    # IMPORTANT: pump.fun ath_market_cap is BROKEN for graduated tokens —
    # values like $9e18 are clearly garbage. Detect and handle this.
    ath_valid = ath > 0 and ath < 1e12  # $1T sanity cap
    if ath_valid:
        ratio = mcap / ath
    else:
        ratio = None  # will use alternative logic

    info = {"mcap": mcap, "ath": ath, "ath_valid": ath_valid,
            "ratio": ratio, "liq": liq_usd,
            "complete": complete, "age_h": age_h, "idle_h": idle_h,
            "name": t.get("name", "?"), "symbol": t.get("symbol", "?")}

    # VOID: low liquidity or dead
    if liq_usd < VOID_MIN_LIQ:
        return "VOID", "low_liq", info
    if idle_h > 6 and not complete:
        return "VOID", "dead", info

    # If ATH is broken, use mcap-based heuristics
    if not ath_valid:
        if complete and mcap >= 100_000:
            return "PUMP", f"graduated, mcap=${mcap:,.0f} (ath invalid)", info
        elif complete and mcap >= 10_000:
            return "NO_SCORE", f"graduated low mcap=${mcap:,.0f} (ath invalid)", info
        elif complete and mcap < 10_000:
            return "RUG", f"graduated but mcap=${mcap:,.0f} (ath invalid)", info
        else:
            return "NO_SCORE", f"ath_invalid, mcap=${mcap:,.0f}", info

    # RUG proxy: current collapsed below 80% of ATH
    if ratio <= RUG_PRICE_RATIO:
        return "RUG", f"ratio={ratio:.2f}", info

    # PUMP proxy: retained >=80% of ATH with healthy liquidity
    if complete and ratio >= PUMP_PRICE_RATIO_ATH:
        return "PUMP", "graduated+healthy", info
    if ratio >= PUMP_PRICE_RATIO_ATH and liq_usd >= ELIGIBLE_MIN_LIQ:
        return "PUMP", f"ratio={ratio:.2f}", info

    return "NO_SCORE", f"ratio={ratio:.2f}", info


def print_bar(label, count, total, width=40):
    pct = count / total * 100 if total > 0 else 0
    filled = int(pct / 100 * width)
    bar = "█" * filled + "░" * (width - filled)
    print(f"  {label:10s} {count:5d}  ({pct:5.1f}%)  {bar}")


def main():
    print("=" * 70)
    print("PUMP OR RUG — Backtest via pump.fun API (V3 thresholds)")
    print(f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"SOL price: ~${SOL_PRICE_USD:.0f}")
    print(f"Thresholds: RUG<=0.80*P0, PUMP>=1.20*P0, LiqFloor=${VOID_MIN_LIQ:,}")
    print(f"Scoring: +{SCORE_CORRECT}/{SCORE_WRONG}, round bonuses +{SCORE_BONUS_3OF4}/+{SCORE_BONUS_PERFECT}")
    print(f"Staking: {STAKE_MIN_SOL:.2f}–{STAKE_MAX_SOL:.0f} SOL, payout {PAYOUT_MULTIPLIER:.1f}x, effective {EFFECTIVE_PAYOUT_MULTIPLIER:.2f}x")
    print("=" * 70)

    # Fetch diverse sample using multiple sort strategies
    print("\n[1/5] Fetching tokens with diverse sampling...")
    all_tokens = {}

    strategies = [
        ("created_timestamp", "DESC", 400, "newest"),
        ("market_cap", "DESC", 400, "highest mcap"),
        ("market_cap", "ASC", 300, "lowest mcap"),
        ("last_trade_timestamp", "DESC", 300, "recently traded"),
    ]

    for sort, order, limit, label in strategies:
        print(f"  {label} (sort={sort} {order})...", end=" ", flush=True)
        batch = fetch_tokens(sort, order, limit)
        new = 0
        for t in batch:
            mint = t.get("mint", "")
            if mint and mint not in all_tokens:
                all_tokens[mint] = t
                new += 1
        print(f"{len(batch)} fetched, {new} new (total unique: {len(all_tokens)})")

    tokens = list(all_tokens.values())
    total = len(tokens)
    print(f"\n  Total unique tokens: {total}")

    # Age distribution
    now_ms = int(time.time() * 1000)
    age_buckets = {"<1h": 0, "1-6h": 0, "6-24h": 0, "1-7d": 0, "7d+": 0}
    for t in tokens:
        age_h = (now_ms - t.get("created_timestamp", 0)) / 3.6e6
        if age_h < 1: age_buckets["<1h"] += 1
        elif age_h < 6: age_buckets["1-6h"] += 1
        elif age_h < 24: age_buckets["6-24h"] += 1
        elif age_h < 168: age_buckets["1-7d"] += 1
        else: age_buckets["7d+"] += 1

    print(f"\n[2/5] Age distribution:")
    for bucket, count in age_buckets.items():
        print_bar(bucket, count, total)

    # Filter to tokens 6h+ old for meaningful settlement
    settled = [t for t in tokens
               if (now_ms - t.get("created_timestamp", 0)) / 3.6e6 >= 6]
    print(f"\n  Tokens 6h+ old (settleable): {len(settled)}")

    if len(settled) < 10:
        print("  Too few settled tokens. Showing all-ages analysis instead.")
        settled = tokens

    # Classify
    print(f"\n[3/5] SETTLEMENT DISTRIBUTION (n={len(settled)})")
    print("=" * 70)

    results = {"PUMP": [], "RUG": [], "VOID": [], "NO_SCORE": []}
    for t in settled:
        outcome, reason, info = classify(t)
        info["reason"] = reason
        results[outcome].append(info)

    stotal = len(settled)
    for outcome in ["PUMP", "RUG", "VOID", "NO_SCORE"]:
        print_bar(outcome, len(results[outcome]), stotal)

    # Examples
    print(f"\n[4/5] EXAMPLES")
    print("=" * 70)

    print(f"\n  PUMP ({len(results['PUMP'])} tokens):")
    for r in sorted(results["PUMP"], key=lambda x: -x["mcap"])[:12]:
        g = "✓grad" if r["complete"] else " bond"
        ratio_s = f"{r['ratio']:.2f}" if r["ratio"] is not None else "N/A "
        ath_s = f"${r['ath']:>12,.0f}" if r["ath_valid"] else "    (invalid)"
        print(f"    {r['symbol']:14s}  mcap=${r['mcap']:>12,.0f}  ath={ath_s}  "
              f"ratio={ratio_s}  {g}  age={r['age_h']:.0f}h")

    print(f"\n  RUG ({len(results['RUG'])} tokens):")
    for r in sorted(results["RUG"], key=lambda x: x["ratio"] if x["ratio"] is not None else 0)[:12]:
        g = "✓grad" if r["complete"] else " bond"
        ratio_s = f"{r['ratio']:.3f}" if r["ratio"] is not None else "N/A  "
        ath_s = f"${r['ath']:>12,.0f}" if r["ath_valid"] else "    (invalid)"
        print(f"    {r['symbol']:14s}  mcap=${r['mcap']:>12,.0f}  ath={ath_s}  "
              f"ratio={ratio_s}  {g}  age={r['age_h']:.0f}h")

    print(f"\n  VOID ({len(results['VOID'])} tokens) — reasons:")
    void_reasons = {}
    for r in results["VOID"]:
        void_reasons[r["reason"]] = void_reasons.get(r["reason"], 0) + 1
    for k, v in sorted(void_reasons.items(), key=lambda x: -x[1]):
        print(f"    {k}: {v}")

    print(f"\n  NO_SCORE ({len(results['NO_SCORE'])} tokens) — sample:")
    for r in sorted(results["NO_SCORE"], key=lambda x: -x["mcap"])[:8]:
        ratio_s = f"{r['ratio']:.2f}" if r["ratio"] is not None else "N/A"
        print(f"    {r['symbol']:14s}  mcap=${r['mcap']:>12,.0f}  ratio={ratio_s}  age={r['age_h']:.0f}h")

    # Scoring analysis
    print(f"\n[5/5] SCORING & BALANCE ANALYSIS")
    print("=" * 70)

    pn = len(results["PUMP"])
    rn = len(results["RUG"])
    scored = pn + rn

    if scored == 0:
        print("  No scored outcomes to analyze.")
        return

    pump_rate = pn / scored * 100
    rug_rate = rn / scored * 100
    score_rate = scored / stotal * 100

    print(f"  Scored:      {scored}/{stotal} ({score_rate:.1f}%)")
    print(f"  PUMP:        {pn} ({pump_rate:.1f}% of scored)")
    print(f"  RUG:         {rn} ({rug_rate:.1f}% of scored)")
    print(f"  VOID+NS:     {stotal - scored} ({100-score_rate:.1f}% non-scoring)")

    always_pump = pn * SCORE_CORRECT + rn * SCORE_WRONG
    always_rug = rn * SCORE_CORRECT + pn * SCORE_WRONG

    breakeven = abs(SCORE_WRONG) / (SCORE_CORRECT + abs(SCORE_WRONG)) * 100

    print(f"\n  Strategy simulation (V3 points: +{SCORE_CORRECT}/{SCORE_WRONG}):")
    print(f"    Always PUMP:  {always_pump:+d} pts  (avg {always_pump/scored:+.2f}/round)")
    print(f"    Always RUG:   {always_rug:+d} pts  (avg {always_rug/scored:+.2f}/round)")
    print(f"    Random 50/50: {(always_pump+always_rug)/2:+.0f} pts")

    print(f"\n  Break-even (with +{SCORE_CORRECT}/{SCORE_WRONG} scoring):")
    print(f"    Always-PUMP profitable when PUMP > {breakeven:.1f}% of scored")
    print(f"    Always-RUG profitable when RUG > {breakeven:.1f}% of scored")

    # Financial EV (flat-stake proxy)
    p = pump_rate / 100
    q = rug_rate / 100
    effective_win = EFFECTIVE_PAYOUT_MULTIPLIER - 1.0
    ev_always_pump = p * effective_win - q
    ev_always_rug = q * effective_win - p
    print(f"\n  Flat-stake EV per scored pick (after 5% rake on winnings):")
    print(f"    Always PUMP: {ev_always_pump:+.4f} stake units")
    print(f"    Always RUG:  {ev_always_rug:+.4f} stake units")

    if pump_rate > 60:
        print(f"\n  ⚠ PROBLEM: PUMP dominates at {pump_rate:.0f}%.")
        print(f"    Always-PUMP yields {always_pump/scored:+.2f} pts/round — too exploitable.")
    elif pump_rate > 50:
        print(f"\n  ⚠ MILD: PUMP slightly favored ({pump_rate:.0f}%).")
        print(f"    Acceptable if flat-stake EV is near zero and volatility stays high.")
    elif rug_rate > 60:
        print(f"\n  ⚠ PROBLEM: RUG dominates at {rug_rate:.0f}%.")
        print(f"    Always-RUG yields {always_rug/scored:+.2f} pts/round — too exploitable.")
    else:
        print(f"\n  ✓ Balanced! Neither strategy dominates (PUMP {pump_rate:.0f}%, RUG {rug_rate:.0f}%).")

    # Manipulation cost estimate
    print(f"\n  Manipulation cost estimate (V3):")
    print(f"    Pool depth: ${VOID_MIN_LIQ:,} minimum")
    print(f"    To force ±20% over 15m TWAP window: ~${VOID_MIN_LIQ * 0.25:,.0f}+ sustained pressure")
    print(f"    Max single-pick stake: {STAKE_MAX_SOL:.0f} SOL")
    print(f"    Verdict: generally negative-ROI to manipulate repeatedly")

    # Hourly supply check
    eligible = sum(1 for t in settled if
                   sol_to_usd(t.get("real_sol_reserves", 0) or 0) >= ELIGIBLE_MIN_LIQ
                   or (t.get("complete") and (t.get("usd_market_cap", 0) or 0) > ELIGIBLE_MIN_LIQ))
    grad = sum(1 for t in settled if t.get("complete"))

    print(f"\n  Token supply (with ${ELIGIBLE_MIN_LIQ:,} liq floor):")
    print(f"    Pass liq filter: {eligible}/{stotal} ({eligible/stotal*100:.1f}%)")
    print(f"    Graduated:       {grad}/{stotal} ({grad/stotal*100:.1f}%)")
    need_week = 4 * 24 * 7  # 4 token slots/hour in V3
    print(f"    Need 4/hour = {need_week}/week minimum (across both launchpads)")
    if eligible >= need_week:
        print(f"    ✓ Supply OK in this sample ({eligible} >= {need_week})")
    elif eligible >= 300:
        print(f"    ⚠ Tight for pump.fun-only ({eligible}). Combine with bags.fm and caching.")
    else:
        print(f"    ⚠ May have gaps — only {eligible} eligible in sample")

    # Limitations
    print(f"\n{'=' * 70}")
    print("LIMITATIONS")
    print("=" * 70)
    print("  1. mcap/ath ratio ≠ 6h TWAP settlement (ATH can be any time)")
    print("  2. No historical L0 — only current liquidity snapshot")
    print("  3. No volume data from pump.fun API")
    print("  4. graduated tokens show real_sol=0 (liq moved to PumpSwap)")
    print("  5. Sample biased toward extremes (highest/lowest mcap sorts)")
    print("  6. True backtest needs OHLCV data (Birdeye/Moralis API)")


if __name__ == "__main__":
    main()
