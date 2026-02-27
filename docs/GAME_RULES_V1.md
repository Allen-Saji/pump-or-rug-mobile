# Game Rules V2 (Rebalanced + Anti-Manipulation)

_Supersedes V1. Changes driven by backtesting 1,290 pump.fun tokens._

## Round cadence
- Every hour: 2 rounds open (pump.fun + bags.fm)
- Prediction window: first 10 minutes
- Settlement time: +6 hours from round open

## What users choose
- `PUMP`
- `RUG`

## Entry
- **0.001 SOL (~$0.14) per prediction**
- Prevents bot armies (1,000 picks/hour = 1 SOL/hour, unprofitable)
- Fees go to prize pool (details in tokenomics phase)

## Metrics used
- `P0` = start TWAP price (minutes 2–10)
- `P1` = end TWAP price (last 15 mins before settlement)
- `L0` = start liquidity
- `L1` = end liquidity

## Settlement order (strict)
1. **VOID** (no score) if data quality is poor:
   - L0 < $25,000
   - round volume < $50,000
   - missing TWAP points
   - major source mismatch (>8%)
2. **RUG** if any:
   - P1 <= 0.50 * P0 (50%+ down)
   - L1 <= 0.30 * L0 (70%+ liquidity drain)
   - tradability breaks / sell-blocked behavior detected
3. **PUMP** if all:
   - P1 >= 2.00 * P0 (100%+ up, 2x)
   - L1 >= 0.60 * L0 (liquidity health check)
4. Else: **NO SCORE**

## Points
- Correct pick: +10
- Wrong pick: -8
- VOID / NO SCORE: 0
- Bonus: +3 if both hourly picks are correct

Break-even: always-X profitable only if X > 44.4% of scored rounds.
With rebalanced thresholds targeting ~50/50 split, no naive strategy should dominate.

## Anti-manipulation measures

### Raised floors
- Liquidity floor $25,000 (was $12,500) — doubles manipulation cost
- Volume floor $50,000 (was $30,000) — thin/manipulated rounds VOID

### TWAP hardening
- P0 window: minutes 2–10 (was 2–5) — harder to spike start price
- P1 window: last 15 min (was 5 min) — attacker must sustain price 15 min, not 5
- Outlier trade filter: any single trade > 15% of pool depth excluded from TWAP calc

### Information controls
- **Hidden token selection**: token not revealed until prediction window opens (prevents front-running)
- **Prediction reveal delay**: individual picks hidden until window closes (prevents herding)

### Future hardening (planned, not launched with V2)
- **Post-settlement fraud detection**: flag rounds where a single wallet cluster moved >X% of volume, void retroactively
- **Cap winnings per account per day**: limits ROI of manipulation even if a whale forces an outcome
- **On-chain identity / staking requirement**: makes Sybil attacks expensive
- **Dynamic liquidity floor**: scale minimum pool depth with prize pool size — as stakes grow, so does manipulation cost

## Why this structure
- Easy for users to understand
- TWAP + outlier filtering resist manipulation
- Raised thresholds make gaming uneconomical (~$10k+ to force PUMP on $25k pool)
- Keeps gameplay fair and fast
