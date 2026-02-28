use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::BetPlaced;
use crate::state::{GlobalConfig, Round, RoundStatus, BetPosition, BetSide};

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

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

    #[account(
        mut,
        seeds = [SEED_VAULT, round.key().as_ref()],
        bump = round.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        init,
        payer = bettor,
        space = 8 + BetPosition::INIT_SPACE,
        seeds = [SEED_BET, round.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet_position: Account<'info, BetPosition>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<PlaceBet>,
    _round_id: u64,
    side: BetSide,
    amount_lamports: u64,
) -> Result<()> {
    require!(amount_lamports > 0, PumpOrRugError::InvalidAmount);
    require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);

    let now = Clock::get()?.unix_timestamp;
    let round = &mut ctx.accounts.round;

    require!(round.status == RoundStatus::Open, PumpOrRugError::RoundNotOpen);
    require!(now >= round.open_ts && now <= round.close_ts, PumpOrRugError::BetWindowClosed);

    transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            Transfer {
                from: ctx.accounts.bettor.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        ),
        amount_lamports,
    )?;

    let pos = &mut ctx.accounts.bet_position;
    pos.round = round.key();
    pos.user = ctx.accounts.bettor.key();
    pos.side = side;
    pos.amount_lamports = amount_lamports;
    pos.claimed = false;
    pos.bump = ctx.bumps.bet_position;

    round.total_pool_lamports = round
        .total_pool_lamports
        .checked_add(amount_lamports)
        .ok_or(PumpOrRugError::MathOverflow)?;

    match side {
        BetSide::Pump => {
            round.total_pump_lamports = round
                .total_pump_lamports
                .checked_add(amount_lamports)
                .ok_or(PumpOrRugError::MathOverflow)?;
        }
        BetSide::Rug => {
            round.total_rug_lamports = round
                .total_rug_lamports
                .checked_add(amount_lamports)
                .ok_or(PumpOrRugError::MathOverflow)?;
        }
    }

    round.total_positions = round
        .total_positions
        .checked_add(1)
        .ok_or(PumpOrRugError::MathOverflow)?;

    emit!(BetPlaced {
        round: round.key(),
        user: ctx.accounts.bettor.key(),
        side,
        amount_lamports,
    });

    Ok(())
}
