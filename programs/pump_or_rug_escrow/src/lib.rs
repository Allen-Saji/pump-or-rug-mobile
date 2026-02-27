use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("PuRugx6dQ9v3KfJdV8s8Yw6Qf2mUQ7uXjR4T9n2k3Lm");

#[program]
pub mod pump_or_rug_escrow {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= 1_000, PumpOrRugError::FeeTooHigh); // max 10%

        let cfg = &mut ctx.accounts.global_config;
        cfg.admin = ctx.accounts.admin.key();
        cfg.resolver = ctx.accounts.admin.key();
        cfg.treasury = ctx.accounts.treasury.key();
        cfg.fee_bps = fee_bps;
        cfg.paused = false;
        cfg.bump = ctx.bumps.global_config;
        Ok(())
    }

    pub fn set_resolver(ctx: Context<AdminOnly>, new_resolver: Pubkey) -> Result<()> {
        let cfg = &mut ctx.accounts.global_config;
        cfg.resolver = new_resolver;
        Ok(())
    }

    pub fn set_treasury(ctx: Context<AdminOnly>, new_treasury: Pubkey) -> Result<()> {
        let cfg = &mut ctx.accounts.global_config;
        cfg.treasury = new_treasury;
        Ok(())
    }

    pub fn set_fee_bps(ctx: Context<AdminOnly>, fee_bps: u16) -> Result<()> {
        require!(fee_bps <= 1_000, PumpOrRugError::FeeTooHigh);
        let cfg = &mut ctx.accounts.global_config;
        cfg.fee_bps = fee_bps;
        Ok(())
    }

    pub fn set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
        let cfg = &mut ctx.accounts.global_config;
        cfg.paused = paused;
        Ok(())
    }

    pub fn create_round(
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
        round.bump = ctx.bumps.round;
        round.vault_bump = ctx.bumps.vault;
        Ok(())
    }

    pub fn place_bet(
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

        Ok(())
    }

    pub fn resolve_round(
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
        require!(
            caller == cfg.admin || caller == cfg.resolver,
            PumpOrRugError::Unauthorized
        );

        let now = Clock::get()?.unix_timestamp;
        let round = &mut ctx.accounts.round;
        require!(round.status == RoundStatus::Open, PumpOrRugError::RoundNotOpen);
        require!(now >= round.settle_ts, PumpOrRugError::RoundNotClosableYet);

        // Security/fairness guard: can't declare directional outcome if one side has zero stake.
        if matches!(outcome, RoundOutcome::Pump | RoundOutcome::Rug) {
            require!(
                round.total_pump_lamports > 0 && round.total_rug_lamports > 0,
                PumpOrRugError::InvalidPoolState
            );
        }

        round.status = RoundStatus::Resolved;
        round.outcome = outcome;
        Ok(())
    }

    pub fn claim(ctx: Context<Claim>, _round_id: u64) -> Result<()> {
        let cfg = &ctx.accounts.global_config;
        let round = &mut ctx.accounts.round;
        let pos = &mut ctx.accounts.bet_position;

        require!(round.status == RoundStatus::Resolved, PumpOrRugError::RoundNotResolved);
        require!(!pos.claimed, PumpOrRugError::AlreadyClaimed);

        let mut payout: u64 = 0;

        match round.outcome {
            RoundOutcome::Void | RoundOutcome::NoScore => {
                payout = pos.amount_lamports;
            }
            RoundOutcome::Pump | RoundOutcome::Rug => {
                let is_winner = matches!(
                    (round.outcome, pos.side),
                    (RoundOutcome::Pump, BetSide::Pump) | (RoundOutcome::Rug, BetSide::Rug)
                );

                if is_winner {
                    let (winner_pool, loser_pool) = match round.outcome {
                        RoundOutcome::Pump => (round.total_pump_lamports, round.total_rug_lamports),
                        RoundOutcome::Rug => (round.total_rug_lamports, round.total_pump_lamports),
                        _ => (0, 0),
                    };

                    require!(winner_pool > 0, PumpOrRugError::InvalidPoolState);

                    let profit_share = ((loser_pool as u128)
                        .checked_mul(pos.amount_lamports as u128)
                        .ok_or(PumpOrRugError::MathOverflow)?)
                        .checked_div(winner_pool as u128)
                        .ok_or(PumpOrRugError::MathOverflow)? as u64;

                    let fee = ((profit_share as u128)
                        .checked_mul(cfg.fee_bps as u128)
                        .ok_or(PumpOrRugError::MathOverflow)?)
                        .checked_div(10_000)
                        .ok_or(PumpOrRugError::MathOverflow)? as u64;

                    let net_profit = profit_share
                        .checked_sub(fee)
                        .ok_or(PumpOrRugError::MathOverflow)?;

                    payout = pos
                        .amount_lamports
                        .checked_add(net_profit)
                        .ok_or(PumpOrRugError::MathOverflow)?;

                    round.fees_collected_lamports = round
                        .fees_collected_lamports
                        .checked_add(fee)
                        .ok_or(PumpOrRugError::MathOverflow)?;
                }
            }
            RoundOutcome::Unknown => return err!(PumpOrRugError::InvalidOutcome),
        }

        if payout > 0 {
            let round_key = round.key();
            let signer_seeds: &[&[u8]] = &[b"vault", round_key.as_ref(), &[round.vault_bump]];
            transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.system_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.vault.to_account_info(),
                        to: ctx.accounts.user.to_account_info(),
                    },
                    &[signer_seeds],
                ),
                payout,
            )?;
        }

        pos.claimed = true;
        Ok(())
    }

    pub fn sweep_fees(ctx: Context<SweepFees>, _round_id: u64) -> Result<()> {
        require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);

        let round = &mut ctx.accounts.round;
        require!(round.status == RoundStatus::Resolved, PumpOrRugError::RoundNotResolved);

        let amount = round.fees_collected_lamports;
        require!(amount > 0, PumpOrRugError::NothingToSweep);

        let round_key = round.key();
        let signer_seeds: &[&[u8]] = &[b"vault", round_key.as_ref(), &[round.vault_bump]];
        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
                &[signer_seeds],
            ),
            amount,
        )?;

        round.fees_collected_lamports = 0;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: treasury can be any system account
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + GlobalConfig::INIT_SPACE,
        seeds = [b"global-config"],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global-config"],
        bump = global_config.bump,
        has_one = admin @ PumpOrRugError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct CreateRound<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global-config"],
        bump = global_config.bump,
        has_one = admin @ PumpOrRugError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        init,
        payer = admin,
        space = 8 + Round::INIT_SPACE,
        seeds = [b"round", &round_id.to_le_bytes()],
        bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        init,
        payer = admin,
        seeds = [b"vault", round.key().as_ref()],
        bump,
        space = 0
    )]
    pub vault: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub bettor: Signer<'info>,

    #[account(
        seeds = [b"global-config"],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [b"round", &round_id.to_le_bytes()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [b"vault", round.key().as_ref()],
        bump = round.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        init,
        payer = bettor,
        space = 8 + BetPosition::INIT_SPACE,
        seeds = [b"bet", round.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet_position: Account<'info, BetPosition>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct ResolveRound<'info> {
    pub resolver: Signer<'info>,

    #[account(
        seeds = [b"global-config"],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [b"round", &round_id.to_le_bytes()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"global-config"],
        bump = global_config.bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [b"round", &round_id.to_le_bytes()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [b"vault", round.key().as_ref()],
        bump = round.vault_bump
    )]
    pub vault: SystemAccount<'info>,

    #[account(
        mut,
        seeds = [b"bet", round.key().as_ref(), user.key().as_ref()],
        bump = bet_position.bump,
        constraint = bet_position.user == user.key() @ PumpOrRugError::Unauthorized,
        constraint = bet_position.round == round.key() @ PumpOrRugError::Unauthorized,
    )]
    pub bet_position: Account<'info, BetPosition>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct SweepFees<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        seeds = [b"global-config"],
        bump = global_config.bump,
        has_one = admin @ PumpOrRugError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,

    #[account(
        mut,
        seeds = [b"round", &round_id.to_le_bytes()],
        bump = round.bump
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [b"vault", round.key().as_ref()],
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

#[account]
#[derive(InitSpace)]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub resolver: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
    pub paused: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Round {
    pub round_id: u64,
    pub status: RoundStatus,
    pub open_ts: i64,
    pub close_ts: i64,
    pub settle_ts: i64,
    pub outcome: RoundOutcome,
    pub total_pool_lamports: u64,
    pub total_pump_lamports: u64,
    pub total_rug_lamports: u64,
    pub fees_collected_lamports: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct BetPosition {
    pub round: Pubkey,
    pub user: Pubkey,
    pub side: BetSide,
    pub amount_lamports: u64,
    pub claimed: bool,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum BetSide {
    Pump,
    Rug,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum RoundStatus {
    Open,
    Resolved,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum RoundOutcome {
    Unknown,
    Pump,
    Rug,
    NoScore,
    Void,
}

#[error_code]
pub enum PumpOrRugError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Program is paused")]
    ProgramPaused,
    #[msg("Round timestamps are invalid")]
    InvalidRoundWindow,
    #[msg("Fee is too high")]
    FeeTooHigh,
    #[msg("Round is not open")]
    RoundNotOpen,
    #[msg("Betting window closed")]
    BetWindowClosed,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Invalid outcome")]
    InvalidOutcome,
    #[msg("Round is not ready to resolve")]
    RoundNotClosableYet,
    #[msg("Round not resolved")]
    RoundNotResolved,
    #[msg("Position already claimed")]
    AlreadyClaimed,
    #[msg("Invalid pool state")]
    InvalidPoolState,
    #[msg("No fees to sweep")]
    NothingToSweep,
}
