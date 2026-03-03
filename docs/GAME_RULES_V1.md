# Game Rules (V1 — Current)

## Round cadence
- Every hour: 4 tokens from pump.fun
- Prediction window: full 60 minutes
- Settlement: at :05 the next hour (via Birdeye price check)

## What users choose
- `PUMP` or `RUG` per token
- **Stake**: 0.01–1 SOL per pick

## Entry & Staking
- **Stake range**: 0.01–1 SOL per pick
- **Max round bet**: 4 SOL (1 × 4 picks)
- **Win**: 1.85x stake returned
- **Lose**: lose entire stake
- **VOID / NO SCORE**: stake refunded

## Settlement (strict order)
1. **VOID** if price data unavailable or token untradeable
2. **RUG** if price drops ≥5%
3. **PUMP** if price rises ≥5%
4. **NO SCORE** if price stays within ±5%

Price measured via Birdeye spot price at settlement time vs. cached price at round open.

## Points (reputation, stake-independent)
- Correct pick: **+5**
- Wrong pick: **-3**
- VOID / NO SCORE: **0**
- Perfect round (all correct, ≥2 bets): **2x multiplier** on round points
- Rug sniper (correctly called a >25% drop): **+3 bonus**

Break-even accuracy: 37.5%

## Win Streaks
Consecutive correct picks across rounds earn +2 bonus per streak level (stacks).

| Streak | Bonus |
|--------|-------|
| 1 | +2 |
| 3 | +6 |
| 5 | +10 |
| 10 | +20 |

Wrong pick → reset to 0.

## Daily Streaks
Play at least once per day to maintain streak. Miss a day → reset.

## Leaderboard
Ranked by points (stake-independent).
- Daily / Weekly / Season / All-time
