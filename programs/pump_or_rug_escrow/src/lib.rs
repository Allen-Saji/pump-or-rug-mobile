#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod helpers;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("PuRugx6dQ9v3KfJdV8s8Yw6Qf2mUQ7uXjR4T9n2k3Lm");

#[program]
pub mod pump_or_rug_escrow {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, fee_bps: u16) -> Result<()> {
        instructions::initialize_config::handler(ctx, fee_bps)
    }

    pub fn set_resolver(ctx: Context<AdminOnly>, new_resolver: Pubkey) -> Result<()> {
        instructions::admin::handler_set_resolver(ctx, new_resolver)
    }

    pub fn set_treasury(ctx: Context<AdminOnly>, new_treasury: Pubkey) -> Result<()> {
        instructions::admin::handler_set_treasury(ctx, new_treasury)
    }

    pub fn set_fee_bps(ctx: Context<AdminOnly>, fee_bps: u16) -> Result<()> {
        instructions::admin::handler_set_fee_bps(ctx, fee_bps)
    }

    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        instructions::admin::handler_set_paused(ctx, paused)
    }

    pub fn create_round(
        ctx: Context<CreateRound>,
        round_id: u64,
        open_ts: i64,
        close_ts: i64,
        settle_ts: i64,
    ) -> Result<()> {
        instructions::create_round::handler(ctx, round_id, open_ts, close_ts, settle_ts)
    }

    pub fn place_bet(
        ctx: Context<PlaceBet>,
        round_id: u64,
        side: BetSide,
        amount_lamports: u64,
    ) -> Result<()> {
        instructions::place_bet::handler(ctx, round_id, side, amount_lamports)
    }

    pub fn resolve_round(
        ctx: Context<ResolveRound>,
        round_id: u64,
        outcome: RoundOutcome,
    ) -> Result<()> {
        instructions::resolve_round::handler_resolve(ctx, round_id, outcome)
    }

    pub fn cancel_round(ctx: Context<ResolveRound>, round_id: u64) -> Result<()> {
        instructions::resolve_round::handler_cancel(ctx, round_id)
    }

    pub fn claim(ctx: Context<Claim>, round_id: u64) -> Result<()> {
        instructions::claim::handler(ctx, round_id)
    }

    pub fn sweep_fees(ctx: Context<SweepFees>, round_id: u64) -> Result<()> {
        instructions::sweep_fees::handler(ctx, round_id)
    }

    pub fn close_round(ctx: Context<CloseRound>, round_id: u64) -> Result<()> {
        instructions::close_round::handler_close(ctx, round_id)
    }

    pub fn force_close_round(
        ctx: Context<CloseRound>,
        round_id: u64,
        grace_seconds: i64,
    ) -> Result<()> {
        instructions::close_round::handler_force_close(ctx, round_id, grace_seconds)
    }
}
