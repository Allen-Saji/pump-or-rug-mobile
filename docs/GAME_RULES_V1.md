# Game Rules V3 (Variable Stakes + Streaks + Leaderboard)

_Supersedes V2. Adds variable staking, payout multiplier, streaks, leaderboard, and rebalanced thresholds._

## Round cadence
- Every hour: 4 token slots open
  - 2 selected from pump.fun
  - 2 selected from bags.fm
- Prediction window: full 60 minutes
- Settlement time: +6 hours from round open

## What users choose
- `PUMP`
- `RUG`
- **Stake**: 0.01–3 SOL per pick (chosen independently per token)

## Entry & Staking
- **Stake range**: 0.01–3 SOL per pick
- **Max round bet**: 12 SOL (3 × 4 picks)
- **Win**: 1.8x stake returned (net +0.8x)
- **Lose**: lose entire stake
- **VOID / NO SCORE**: stake refunded
- **Rake**: 5% on winnings only → effective win = 1.76x stake
- Rake funds prize pool + operations
- Max round profit ≈ 9.12 SOL (~$1,275) — well below ~$7k manipulation cost

## Metrics used
- `P0` = start TWAP price (minutes 2–10)
- `P1` = end TWAP price (last 15 mins before settlement)
- `L0` = start liquidity
- `L1` = end liquidity

## Settlement order (strict)
1. **VOID** (no score, stake refunded) if data quality is poor:
   - L0 < $25,000
   - round volume < $50,000
   - missing TWAP points
   - major source mismatch (>8%)
2. **RUG** if any:
   - P1 <= 0.80 × P0 (20%+ down)
   - L1 <= 0.30 × L0 (70%+ liquidity drain)
   - tradability breaks / sell-blocked behavior detected
3. **PUMP** if all:
   - P1 >= 1.20 × P0 (20%+ up)
   - L1 >= 0.60 × L0 (liquidity health check)
4. Else: **NO SCORE** (stake refunded)

## Points (reputation, stake-independent)
- Correct pick: **+10**
- Wrong pick: **-3**
- VOID / NO SCORE: **0**
- 3/4 round bonus: **+5**
- Perfect round (4/4): **+15**

Break-even accuracy: 23.1% (you only need ~1 in 4 correct to not lose points).

## Win Streaks (points multiplier)
Consecutive correct picks across rounds:

| Streak | Multiplier |
|--------|-----------|
| 0–2    | 1.0x      |
| 3      | 1.2x      |
| 5      | 1.5x      |
| 8      | 2.0x      |
| 12+    | 2.5x cap  |

- Wrong pick → reset to 0
- VOID/NS → freezes streak (no break)

## Daily Streaks (≥1 pick/day, UTC)

| Day | Reward |
|-----|--------|
| 1   | +5 pts |
| 3   | +10 pts |
| 7   | +25 pts + badge |
| 14  | +50 pts |
| 30  | +100 pts + Degen of the Month badge |

- Miss a day → reset
- Badges are permanent

## Leaderboard & Prizes
Ranked by points (whale-proof: points don't scale with stake).

### Timeframes
- Daily / Weekly / Season (4 weeks) / All-time

### Season prize pool (from accumulated rake)
- #1: 50%
- #2–3: 20%
- #4–10: 20%
- #11–50: 10%

### Daily prizes
- Top 3 split a small daily pot

### Eligibility
- Minimum 20 picks/week for leaderboard eligibility

## Anti-manipulation measures

### Raised floors
- Liquidity floor $25,000 — doubles manipulation cost
- Volume floor $50,000 — thin/manipulated rounds VOID

### TWAP hardening
- P0 window: minutes 2–10 — harder to spike start price
- P1 window: last 15 min — attacker must sustain price 15 min
- Outlier trade filter: any single trade > 15% of pool depth excluded from TWAP calc

### Information controls
- **Hidden token selection**: token not revealed until prediction window opens (prevents front-running)
- **Prediction reveal delay**: individual picks hidden until window closes (prevents herding)

### Economic deterrence
- Max round profit ≈ 9.12 SOL (~$1,275)
- Estimated manipulation cost: ~$7,000+ per round
- ROI of manipulation: deeply negative

### Future hardening (planned, not launched)
- Post-settlement fraud detection: flag rounds where a single wallet cluster moved >X% of volume, void retroactively
- Cap winnings per account per day
- On-chain identity / staking requirement: makes Sybil attacks expensive
- Dynamic liquidity floor: scale minimum pool depth with prize pool size

## Why this structure
- Easy for users to understand
- Variable stakes reward conviction without inflating points
- TWAP + outlier filtering resist manipulation
- Leaderboard is skill-based (points), not wealth-based (stake)
- Streaks drive daily retention
- Keeps gameplay fair and fast
