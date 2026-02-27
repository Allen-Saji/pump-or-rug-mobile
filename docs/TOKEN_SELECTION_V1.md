# Token Selection V2 (Rebalanced)

_Supersedes V1. Raised floors + randomized selection to resist manipulation._

Every hour, select:
- 2 tokens from pump.fun
- 2 tokens from bags.fm

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

From the **top 5** eligible tokens, select **2 using weighted random draw**.
- Weight of each token is proportional to its activity score.
- Higher score = higher chance, not guaranteed.

This preserves quality while preventing deterministic front-running.

Fallback (if <5 eligible): select from all eligible using the same weighted logic.

## Fail-safe
Per platform, per hour:
- If at least 2 qualify: select 2
- If exactly 1 qualifies: select 1 and mark 1 slot as `SKIPPED`
- If 0 qualify: mark both slots as `SKIPPED`

Keep the other platform live regardless.

## Why these filters
- $25k liquidity floor makes pool manipulation uneconomical
- Random selection from top-5 prevents front-running
- Preserve trust in settlement
