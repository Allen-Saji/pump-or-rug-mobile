# Pump or Rug Escrow — Security Audit

Scope: `programs/pump_or_rug_escrow/src/lib.rs`
Reviewer mode: manual security review

---

## V1 — Initial Hardening (2026-02-27)

### Summary

The contract is in a hackathon-safe state for minimal escrow betting flow:
on-chain custody in PDA vault, deterministic claim logic, admin/resolver gating, fee accounting and sweep. No critical exploit found after hardening pass.

### Threat Model

Assets at risk:
- User stakes in round vault PDA
- Protocol fee balance

Adversaries:
- Malicious bettor trying to over-claim
- Unauthorized resolver/admin actions
- Griefing via invalid round states

### Findings & Fixes

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| 1 | HIGH | One-sided pool resolve creates unfair outcomes | `resolve_round` rejects Pump/Rug when either side pool is zero (`InvalidPoolState`) |
| 2 | MEDIUM | Resolver could finalize before settle timestamp | Enforce `now >= settle_ts` in `resolve_round` |
| 3 | MEDIUM | No admin control surface for rotation/pause | Added `set_resolver`, `set_treasury`, `set_fee_bps`, `set_paused` under `AdminOnly` constraints |
| 4 | LOW | Admin checks duplicated/inconsistent | Normalized with `has_one = admin` constraints |

### Residual Risks

1. **Single bet per user per round** — PDA seeds enforce one position per user/round. Product choice.
2. **Rounding dust** — Pro-rata integer math may leave tiny lamport dust. Acceptable for MVP.
3. **Off-chain resolution oracle trust** — Contract trusts resolver input. Production needs signed oracle attestation.
4. **No emergency withdraw flow** — Only standard claim/sweep supported.

---

## V2 — Lifecycle Hardening (2026-02-27)

### New Controls

1. **Cancellation safety** — `cancel_round` resolves open rounds to `Void` for principal refunds
2. **Claim-completeness gating** — `close_round` requires `claimed_positions == total_positions`
3. **Round final lifecycle state** — `RoundStatus::Closed` prevents ambiguous post-settlement state
4. **Residual lamport handling** — `close_round` transfers remaining vault lamports to treasury

### Security Checklist

- [x] Admin controls gated by `has_one = admin`
- [x] Resolver/admin authorization for round resolution
- [x] Bet placement constrained by time window + open status
- [x] Claims constrained to resolved status + one-time flag
- [x] Directional resolution blocked when one side has zero stake
- [x] Fee sweeping restricted to admin and tracked fee bucket
- [x] Round close blocked until all known positions are claimed

### New Residual Risks

- **Lifecycle finality** — `close_round` requires every position claimed; inactive wallets can delay closure. Consider deadline-based forced close post-hackathon.

---

## V3 — Operability & Monitoring (2026-02-27)

### Changes

1. **Event emissions** across all critical paths (config updates, round lifecycle, bets, claims, fee sweeps)
2. **Force-close pathway** — `force_close_round(round_id, grace_seconds)` allows closure after grace period even if not all claims completed; sweeps residual to treasury
3. **Claim accounting retained** — `total_positions`, `claimed_positions`; normal `close_round` still requires all claims

### Force-Close Tradeoff

If users fail to claim before grace expiry, unclaimed value is swept to treasury. Intentional policy tradeoff (liveness over indefinite escrow lock). Must be disclosed in UX/terms.

### Recommended Policy Parameters

- `grace_seconds`: 72h for production-like fairness
- Alerting: emit + monitor force-close events
- UX: show claim deadline countdown in app

---

## Invariants (All Versions)

- [x] Bets only during open window
- [x] Round must be resolved before claims
- [x] Claim is one-time (`claimed` flag)
- [x] Vault transfers use PDA signer seeds
- [x] Fee sweep only by admin
- [x] Program pause gate on state-changing operations
- [x] Resolve blocked for one-sided directional outcomes
- [x] Round close blocked until all positions claimed (or force-close after grace)

## Verification

- `anchor build` passes
- `anchor test` passes (TS e2e suite covering full lifecycle)
- Rust unit tests for payout math edge cases

## Post-Hackathon Priorities

1. Oracle attestation / challenge window for `resolve_round`
2. Explicit round-level `claim_deadline_ts` storage instead of dynamic grace input
3. Integration tests for `cancel_round` and `force_close_round` branches
4. Protocol decision for unclaimed funds split (treasury vs rewards pool)
5. Formal invariant/property tests (sum of payouts + fees <= vault inflow)
