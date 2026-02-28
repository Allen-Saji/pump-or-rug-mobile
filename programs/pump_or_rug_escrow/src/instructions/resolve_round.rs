use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::{RoundResolved, RoundCancelled};
use crate::state::{GlobalConfig, Round, RoundStatus, RoundOutcome};

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct ResolveRound<'info> {
    pub resolver: Signer<'info>,

    #[account(
        seeds = [SEED_GLOBAL_CONFIG],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [SEED_ROUND, round_id.to_le_bytes().as_ref()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,
}

pub fn handler_resolve(
    ctx: Context<ResolveRound>,
    _round_id: u64,
    outcome: RoundOutcome,
) -> Result<()> {
    require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);
    require!(
        outcome != RoundOutcome::Unknown,
        PumpOrRugError::InvalidOutcome
    );

    let caller = ctx.accounts.resolver.key();
    let cfg = &ctx.accounts.global_config;
    // H3 note: resolver trust assumption — the resolver can see pool state
    // before choosing an outcome. Production deployments should use an external
    // oracle or commit-reveal scheme to prevent front-running.
    require!(
        caller == cfg.admin || caller == cfg.resolver,
        PumpOrRugError::Unauthorized
    );

    let now = Clock::get()?.unix_timestamp;
    let round = &mut ctx.accounts.round;
    require!(round.status == RoundStatus::Open, PumpOrRugError::RoundNotOpen);
    require!(now >= round.settle_ts, PumpOrRugError::RoundNotClosableYet);

    if matches!(outcome, RoundOutcome::Pump | RoundOutcome::Rug) {
        require!(
            round.total_pump_lamports > 0 && round.total_rug_lamports > 0,
            PumpOrRugError::InvalidPoolState
        );
    }

    round.status = RoundStatus::Resolved;
    round.outcome = outcome;
    emit!(RoundResolved { round: round.key(), outcome });
    Ok(())
}

// M2 note: cancel has no time guard by design — it is an emergency admin action.
// The admin/resolver can cancel at any time while the round is Open, voiding all
// bets (users get full refunds via claim). This is an admin trust assumption.
pub fn handler_cancel(ctx: Context<ResolveRound>, _round_id: u64) -> Result<()> {
    require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);

    let caller = ctx.accounts.resolver.key();
    let cfg = &ctx.accounts.global_config;
    require!(
        caller == cfg.admin || caller == cfg.resolver,
        PumpOrRugError::Unauthorized
    );

    let round = &mut ctx.accounts.round;
    require!(round.status == RoundStatus::Open, PumpOrRugError::RoundNotOpen);
    round.status = RoundStatus::Resolved;
    round.outcome = RoundOutcome::Void;
    emit!(RoundCancelled { round: round.key() });
    Ok(())
}
