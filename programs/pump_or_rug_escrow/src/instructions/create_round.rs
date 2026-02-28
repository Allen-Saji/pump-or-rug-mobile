use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::RoundCreated;
use crate::state::{GlobalConfig, Round, RoundStatus, RoundOutcome};

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct CreateRound<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GLOBAL_CONFIG],
        bump = global_config.bump,
        has_one = admin @ PumpOrRugError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        init,
        payer = admin,
        space = 8 + Round::INIT_SPACE,
        seeds = [SEED_ROUND, round_id.to_le_bytes().as_ref()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [SEED_VAULT, round.key().as_ref()],
        bump
    )]
    /// CHECK: created via invoke_signed in create_round
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateRound>,
    round_id: u64,
    open_ts: i64,
    close_ts: i64,
    settle_ts: i64,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);
    require!(open_ts < close_ts && close_ts < settle_ts, PumpOrRugError::InvalidRoundWindow);
    require!(settle_ts > now, PumpOrRugError::InvalidRoundWindow);

    let round = &mut ctx.accounts.round;
    round.round_id = round_id;
    round.status = RoundStatus::Open;
    round.open_ts = open_ts;
    round.close_ts = close_ts;
    round.settle_ts = settle_ts;
    round.outcome = RoundOutcome::Unknown;
    round.total_pool_lamports = 0;
    round.total_pump_lamports = 0;
    round.total_rug_lamports = 0;
    round.fees_collected_lamports = 0;
    round.total_positions = 0;
    round.claimed_positions = 0;
    round.bump = ctx.bumps.round;
    round.vault_bump = ctx.bumps.vault;

    // Create the vault PDA as a 0-data system account.
    if ctx.accounts.vault.data_is_empty() {
        let rent_lamports = Rent::get()?.minimum_balance(0);
        let ix = system_instruction::create_account(
            &ctx.accounts.admin.key(),
            &ctx.accounts.vault.key(),
            rent_lamports,
            0,
            &anchor_lang::solana_program::system_program::ID,
        );
        let round_key = round.key();
        let vault_signer: &[&[u8]] = &[SEED_VAULT, round_key.as_ref(), &[round.vault_bump]];
        invoke_signed(
            &ix,
            &[
                ctx.accounts.admin.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            &[vault_signer],
        )?;
    }

    emit!(RoundCreated {
        round: round.key(),
        round_id,
        open_ts,
        close_ts,
        settle_ts,
    });

    Ok(())
}
