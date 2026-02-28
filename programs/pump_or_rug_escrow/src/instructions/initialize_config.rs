use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::ConfigInitialized;
use crate::state::GlobalConfig;

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
        seeds = [SEED_GLOBAL_CONFIG],
        bump
    )]
    pub global_config: Account<'info, GlobalConfig>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeConfig>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, PumpOrRugError::FeeTooHigh);

    let cfg = &mut ctx.accounts.global_config;
    cfg.admin = ctx.accounts.admin.key();
    cfg.resolver = ctx.accounts.admin.key();
    cfg.treasury = ctx.accounts.treasury.key();
    cfg.fee_bps = fee_bps;
    cfg.paused = false;
    cfg.bump = ctx.bumps.global_config;

    emit!(ConfigInitialized {
        admin: cfg.admin,
        treasury: cfg.treasury,
        fee_bps: cfg.fee_bps,
    });
    Ok(())
}
