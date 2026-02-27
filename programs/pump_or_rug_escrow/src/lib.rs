use anchor_lang::prelude::*;

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

    pub fn create_round(
        ctx: Context<CreateRound>,
        round_id: u64,
        open_ts: i64,
        close_ts: i64,
        settle_ts: i64,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(!ctx.accounts.global_config.paused, PumpOrRugError::ProgramPaused);
        require_keys_eq!(ctx.accounts.admin.key(), ctx.accounts.global_config.admin, PumpOrRugError::Unauthorized);
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
        round.bump = ctx.bumps.round;
        round.vault_bump = ctx.bumps.vault;
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
#[instruction(round_id: u64)]
pub struct CreateRound<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [b"global-config"],
        bump = global_config.bump
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
        seeds = [b"vault", round.key().as_ref()],
        bump
    )]
    /// CHECK: PDA escrow vault for lamports (created implicitly by transfers later)
    pub vault: UncheckedAccount<'info>,

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
    pub bump: u8,
    pub vault_bump: u8,
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
}
