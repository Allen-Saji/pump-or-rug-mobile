# Token Selection

Every hour, select 4 tokens from pump.fun.

## Eligibility filters (must pass all)
1. Token age: ≥ 5 minutes
2. Estimated liquidity ≥ $5,000
3. Not used in the last 24 hours (cooldown)

## Ranking
Activity Score (recency-weighted):
- 70% trade recency (how recently the token was traded)
- 30% engagement (reply count / community activity)

From the **top 5** eligible tokens, select **4 using weighted random draw**.
- Weight proportional to activity score
- Higher score = higher chance, not guaranteed

Keeps quality high while preventing deterministic front-running.

## Fail-safe
- If < 4 eligible: select all available, round runs with fewer tokens
- If < 2 eligible: skip round generation

## Why these filters
- Liquidity floor makes manipulation uneconomical
- Cooldown keeps game fresh — no repeats within 24h
- Random selection from top-5 prevents front-running
