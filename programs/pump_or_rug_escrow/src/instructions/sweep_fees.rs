use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::FeesSwept;
use crate::helpers::transfer_from_vault;
use crate::state::{GlobalConfig, Round, RoundStatus};

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct SweepFees<'info> {
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

pub fn handler(ctx: Context<SweepFees>, _round_id: u64) -> Result<()> {
    require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);

    let round = &mut ctx.accounts.round;
    require!(round.status == RoundStatus::Resolved, PumpOrRugError::RoundNotResolved);

    let amount = round.fees_collected_lamports;
    require!(amount > 0, PumpOrRugError::NothingToSweep);

    let round_key = round.key();
    transfer_from_vault(
        &ctx.accounts.vault.to_account_info(),
        &ctx.accounts.treasury.to_account_info(),
        &ctx.accounts.system_program.to_account_info(),
        round.vault_bump,
        &round_key,
        amount,
    )?;

    round.fees_collected_lamports = 0;
    emit!(FeesSwept { round: round.key(), amount_lamports: amount });
    Ok(())
}
