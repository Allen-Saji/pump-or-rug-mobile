# Token Selection V2 (Rebalanced)

_Supersedes V1. Raised floors + randomized selection to resist manipulation._

Every hour, select:
- 1 token from pump.fun
- 1 token from bags.gm

## Eligibility filters (must pass all)
1. Token age: 15 minutes to 72 hours
2. Starting liquidity (L0) >= $25,000
3. Last 30m volume >= $30,000
4. Active tradable pool (not halted)
5. Not used in the last 24 hours
6. Data available from required market sources

## Ranking (if multiple pass)
Use Activity Score:

score = 0.45 * volume_30m_norm
      + 0.30 * tx_count_30m_norm
      + 0.15 * holder_growth_norm
      + 0.10 * social_momentum_norm

From the **top 5** eligible tokens, select one **randomly**.
This prevents prediction of which token will be chosen while still filtering for quality.

Tie-break (if <5 eligible): newest token wins.

## Fail-safe
If no token qualifies on a platform that hour:
- mark that platform round as `SKIPPED`
- keep the other platform round live

## Why these filters
- $25k liquidity floor makes pool manipulation uneconomical
- Random selection from top-5 prevents front-running
- Preserve trust in settlement
