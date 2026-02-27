# Pump or Rug Escrow — Security Review (V1)

Date: 2026-02-27
Scope: `programs/pump_or_rug_escrow/src/lib.rs`
Reviewer mode: senior security audit (manual)

## Summary

The contract is now in a good hackathon-safe state for minimal escrow betting flow:
- on-chain custody in PDA vault
- deterministic claim logic
- admin/resolver gating
- fee accounting and sweep

No critical exploit was found in the current logic after hardening pass.

---

## Threat Model

Assets at risk:
- user stakes in round vault PDA
- protocol fee balance

Adversaries:
- malicious bettor trying to over-claim
- unauthorized resolver/admin actions
- griefing via invalid round states

---

## Findings & Fixes Applied

### 1) Directional resolve with one-sided pool (HIGH)
**Risk:** If only one side has bets, resolving to that side can create unfair/disputed outcomes.
**Fix:** `resolve_round` now rejects `Pump/Rug` when either side pool is zero (`InvalidPoolState`).

### 2) Early resolve before settle timestamp (MEDIUM)
**Risk:** Resolver could finalize too early.
**Fix:** enforce `now >= settle_ts` in `resolve_round`.

### 3) Missing admin control surface (MEDIUM)
**Risk:** No governed way to rotate resolver/treasury or pause during incidents.
**Fix:** added `set_resolver`, `set_treasury`, `set_fee_bps`, `set_paused` under `AdminOnly` account constraints.

### 4) Admin checks duplicated/inconsistent (LOW)
**Risk:** scattered key comparisons can drift.
**Fix:** normalized with `has_one = admin` constraints in admin contexts.

---

## Residual Risks / Known Limitations

1. **Single bet per user per round**
   - Current PDA seeds enforce one position per user/round.
   - Product choice; not a security bug.

2. **Rounding dust**
   - Pro-rata integer math may leave tiny lamport dust in vault.
   - Acceptable for MVP; can add `close_round` dust sweep later.

3. **Off-chain resolution oracle trust**
   - Contract trusts resolver outcome input.
   - For production, add signed oracle attestation / optimistic challenge flow.

4. **No emergency withdraw flow**
   - Only standard claim/sweep supported.
   - Could add guarded emergency circuit for severe incidents.

---

## Invariants Checklist

- [x] Bets only during open window
- [x] Round must be resolved before claims
- [x] Claim is one-time (`claimed` flag)
- [x] Vault transfers use PDA signer seeds
- [x] Fee sweep only by admin
- [x] Program pause gate on state-changing operations
- [x] Resolve blocked for one-sided directional outcomes

---

## Recommended Next Hardening (Post-hackathon)

1. Add event logs for all critical state changes
2. Add integration tests with exact payout accounting across many bettors
3. Add formal invariant/property tests (sum of payouts + fees <= vault inflow)
4. Add oracle attestation model for resolution proofs
5. Add `close_round` instruction for dust handling + lifecycle finalization
