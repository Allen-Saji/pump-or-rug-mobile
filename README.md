# Pump or Rug Mobile

Degen prediction game for Solana Mobile (Radiance / Monolith direction).

This repo currently contains the litepaper docs + implementation guide.

## Docs
- `docs/IDEA_OVERVIEW.md` — simple concept + why it should exist
- `docs/GAME_RULES_V1.md` — locked rules and settlement logic
- `docs/TOKEN_SELECTION_V1.md` — how tokens are selected each hour
- `docs/IMPLEMENTATION_GUIDE_7D.md` — 1-week execution plan (build now)
- `docs/LITEPAPER_SITE_CONTENT.md` — copy structure for degen-litepaper website

## Goal
Ship a mobile-first app and a fun degen-litepaper site that anyone can understand in 60 seconds.

## On-chain status (Anchor 0.32.1)
Implemented in `programs/pump_or_rug_escrow`:
- initialize_config
- admin controls: set_resolver, set_treasury, set_fee_bps, set_paused
- create_round
- place_bet (escrow transfer into vault PDA)
- resolve_round
- claim (refund/pro-rata payout with fee)
- sweep_fees

Security review notes: `SECURITY_AUDIT_V1.md`
