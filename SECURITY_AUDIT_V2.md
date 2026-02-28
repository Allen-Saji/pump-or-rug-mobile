# Pump or Rug Escrow — Security Review (V2)

Date: 2026-02-27
Scope: `programs/pump_or_rug_escrow/src/lib.rs`

## Executive summary

V2 introduces lifecycle hardening beyond V1:
- round cancellation path (`cancel_round`) for safe refunds
- claim accounting (`total_positions`, `claimed_positions`)
- explicit finalization (`close_round`) only after all claims
- residual vault dust sweep on close

No critical exploitable issues were found in current on-chain payout/custody logic under reviewed assumptions.

---

## New controls added in V2

1. **Cancellation safety**
   - `cancel_round` can resolve open rounds to `Void`.
   - Enables principal refunds if off-chain settlement pipeline fails.

2. **Claim-completeness gating**
   - `close_round` requires `claimed_positions == total_positions`.
   - Prevents premature vault finalization before all users have claimed.

3. **Round final lifecycle state**
   - `RoundStatus::Closed` added.
   - Prevents ambiguous post-settlement state handling.

4. **Residual lamport handling**
   - `close_round` transfers remaining vault lamports to treasury after all claims.

---

## Security checklist (V2)

- [x] Admin controls gated by `has_one = admin`
- [x] Resolver/admin authorization for round resolution
- [x] Bet placement constrained by time window + open status
- [x] Claims constrained to resolved status + one-time flag
- [x] Directional resolution blocked when one side has zero stake
- [x] Fee sweeping restricted to admin and tracked fee bucket
- [x] Round close blocked until all known positions are claimed

---

## Residual risks

1. **Oracle trust model remains centralized**
   - Resolver still provides final outcome.
   - Recommended: oracle attestation hash + challenge window.

2. **Single-position per wallet per round**
   - Product tradeoff; sybil risk exists at application layer.
   - Mitigate off-chain with anti-sybil heuristics.

3. **Lifecycle finality policy**
   - `close_round` requires every position claimed; inactive wallets can delay closure.
   - Consider deadline-based forced close with unclaimed sink policy post-hackathon.

---

## Test evidence

- `anchor build` passes
- `anchor test` passes with TS e2e suite:
  - initialize config
  - create round
  - place both-side bets
  - resolve round
  - claim winner/loser
  - sweep fees
  - close round

(Observed occasional local websocket warnings in environment, but test assertions pass.)
