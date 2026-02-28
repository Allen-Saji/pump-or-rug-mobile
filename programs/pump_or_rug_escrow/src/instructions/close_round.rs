use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::{RoundClosed, RoundForceClosed};
use crate::helpers::transfer_from_vault;
use crate::state::{GlobalConfig, Round, RoundStatus};

// H2 fix: close_round closes the Round account via `close = admin`, reclaiming rent.
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct CloseRound<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [SEED_GLOBAL_CONFIG],
        bump = global_config.bump,
        has_one = admin @ PumpOrRugError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        close = admin,
        seeds = [SEED_ROUND, round_id.to_le_bytes().as_ref()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [SEED_VAULT, round.key().as_ref()],
        bump = round.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        address = global_config.treasury
    )]
    /// CHECK: treasury destination validated by address
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

// C1 fix: ForceCloseRound does NOT close the Round account so users can still claim.
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct ForceCloseRound<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [SEED_GLOBAL_CONFIG],
        bump = global_config.bump,
        has_one = admin @ PumpOrRugError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [SEED_ROUND, round_id.to_le_bytes().as_ref()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [SEED_VAULT, round.key().as_ref()],
        bump = round.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        address = global_config.treasury
    )]
    /// CHECK: treasury destination validated by address
    pub treasury: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler_close(ctx: Context<CloseRound>, _round_id: u64) -> Result<()> {
    require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);

    let round = &ctx.accounts.round;
    // Accept both Resolved and Closed (allows close after force_close once all claimed)
    require!(
        round.status == RoundStatus::Resolved || round.status == RoundStatus::Closed,
        PumpOrRugError::RoundNotResolved
    );
    require!(
        round.claimed_positions == round.total_positions,
        PumpOrRugError::ClaimsPending
    );

    let vault_balance = **ctx.accounts.vault.lamports.borrow();
    if vault_balance > 0 {
        let round_key = round.key();
        transfer_from_vault(
            &ctx.accounts.vault.to_account_info(),
            &ctx.accounts.treasury.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            &round_key,
            round.vault_bump,
            vault_balance,
        )?;
    }

    // Round account is closed via `close = admin` constraint after handler returns
    emit!(RoundClosed { round: round.key(), residual_swept_lamports: vault_balance });
    Ok(())
}

// C1 fix: force_close only sweeps accumulated fees, NOT the full vault.
// Users can still claim their winnings/refunds on a Closed round.
// After all claims, admin calls close_round to reclaim the Round account rent.
pub fn handler_force_close(
    ctx: Context<ForceCloseRound>,
    _round_id: u64,
    grace_seconds: i64,
) -> Result<()> {
    require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);
    let now = Clock::get()?.unix_timestamp;

    let round = &mut ctx.accounts.round;
    require!(round.status == RoundStatus::Resolved, PumpOrRugError::RoundNotResolved);
    require!(grace_seconds >= 0, PumpOrRugError::InvalidGracePeriod);
    require!(
        now >= round.settle_ts.saturating_add(grace_seconds),
        PumpOrRugError::GracePeriodNotElapsed
    );

    // Only sweep fees — leave user funds in the vault for late claims
    let fee_amount = round.fees_collected_lamports;
    if fee_amount > 0 {
        let round_key = round.key();
        transfer_from_vault(
            &ctx.accounts.vault.to_account_info(),
            &ctx.accounts.treasury.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            &round_key,
            round.vault_bump,
            fee_amount,
        )?;
        round.fees_collected_lamports = 0;
    }

    round.status = RoundStatus::Closed;
    emit!(RoundForceClosed {
        round: round.key(),
        fees_swept_lamports: fee_amount,
        grace_seconds,
    });
    Ok(())
}
