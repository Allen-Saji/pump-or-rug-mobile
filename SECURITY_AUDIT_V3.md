# Pump or Rug Escrow — Security Review (V3)

Date: 2026-02-27
Scope: `programs/pump_or_rug_escrow/src/lib.rs`

## V3 focus
- lifecycle finality under griefing/non-claimers
- operability during degraded resolver/data windows
- auditability and monitoring

## Changes introduced

1. **Event emissions across critical paths**
   - Config/admin updates
   - round creation / cancellation / resolution / closure
   - bet placements
   - claims
   - fee sweeps

2. **Force-close pathway**
   - `force_close_round(round_id, grace_seconds)`
   - allows closure after grace period elapsed, even if not all claims completed
   - sweeps residual vault balance to treasury

3. **Claim accounting retained**
   - `total_positions`, `claimed_positions`
   - normal `close_round` still requires all claims complete

## Security assessment

### Strengths
- Strong auth boundaries (admin/resolver separation)
- Deterministic payout math with checked arithmetic
- Explicit, auditable state transitions
- Operational fail-safe for stuck rounds via force-close

### Tradeoff introduced by force-close
- If users fail to claim before grace expiry, unclaimed value is swept to treasury.
- This is an intentional policy tradeoff (liveness over indefinite escrow lock).
- Must be clearly disclosed in product UX/terms.

## Recommended policy parameters

- `grace_seconds`: start with 72h for production-like fairness
- Alerting: emit + monitor force-close events
- UX: show claim deadline countdown in app

## Remaining high-priority post-hackathon items

1. Oracle attestation / challenge window for `resolve_round`
2. Add explicit round-level `claim_deadline_ts` storage instead of dynamic grace input
3. Add integration test for `cancel_round` and `force_close_round` branches
4. Consider protocol decision for unclaimed funds split (treasury vs rewards pool)

## Verification status

- `anchor build` passes
- `anchor test` passes (TS e2e)
- Existing e2e validates happy-path lifecycle; edge-path tests for force-close/cancel are next
