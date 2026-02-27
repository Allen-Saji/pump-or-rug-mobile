# Game Rules V1 (Locked)

## Round cadence
- Every hour: 2 rounds open (pump.fun + bags.gm)
- Prediction window: first 10 minutes
- Settlement time: +6 hours from round open

## What users choose
- `PUMP`
- `RUG`

## Metrics used
- `P0` = start TWAP price (minute 2–5)
- `P1` = end TWAP price (last 5 mins before settlement)
- `L0` = start liquidity
- `L1` = end liquidity

## Settlement order (strict)
1. **VOID** (no score) if data quality is poor:
   - L0 < $12,500
   - round volume < $30,000
   - missing TWAP points
   - major source mismatch (>8%)
2. **RUG** if any:
   - P1 <= 0.30 * P0 (70%+ down)
   - L1 <= 0.20 * L0 (80%+ liquidity drain)
   - tradability breaks / sell-blocked behavior detected
3. **PUMP** if all:
   - P1 >= 1.35 * P0 (35%+ up)
   - L1 >= 0.70 * L0 (liquidity health check)
4. Else: **NO SCORE**

## Points
- Correct pick: +10
- Wrong pick: -6
- VOID / NO SCORE: 0
- Bonus: +5 if both hourly picks are correct

## Why this structure
- Easy for users to understand
- Harder to manipulate than single-candle logic
- Keeps gameplay fair and fast
