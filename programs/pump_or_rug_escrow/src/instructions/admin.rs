use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::{AdminTransferred, ResolverUpdated, TreasuryUpdated, FeeUpdated, PauseUpdated};
use crate::state::GlobalConfig;

#[derive(Accounts)]
pub struct AdminOnly<'info> {
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [SEED_GLOBAL_CONFIG],
        bump = global_config.bump,
        has_one = admin @ PumpOrRugError::Unauthorized,
    )]
    pub global_config: Account<'info, GlobalConfig>,
}

// L1 fix: admin rotation to prevent permanent lockout if key is compromised
pub fn handler_set_admin(ctx: Context<AdminOnly>, new_admin: Pubkey) -> Result<()> {
    require!(new_admin != Pubkey::default(), PumpOrRugError::Unauthorized);
    let cfg = &mut ctx.accounts.global_config;
    let old_admin = cfg.admin;
    cfg.admin = new_admin;
    emit!(AdminTransferred { old_admin, new_admin });
    Ok(())
}

pub fn handler_set_resolver(ctx: Context<AdminOnly>, new_resolver: Pubkey) -> Result<()> {
    let cfg = &mut ctx.accounts.global_config;
    cfg.resolver = new_resolver;
    emit!(ResolverUpdated { resolver: new_resolver });
    Ok(())
}

pub fn handler_set_treasury(ctx: Context<AdminOnly>, new_treasury: Pubkey) -> Result<()> {
    let cfg = &mut ctx.accounts.global_config;
    cfg.treasury = new_treasury;
    emit!(TreasuryUpdated { treasury: new_treasury });
    Ok(())
}

pub fn handler_set_fee_bps(ctx: Context<AdminOnly>, fee_bps: u16) -> Result<()> {
    require!(fee_bps <= MAX_FEE_BPS, PumpOrRugError::FeeTooHigh);
    let cfg = &mut ctx.accounts.global_config;
    cfg.fee_bps = fee_bps;
    emit!(FeeUpdated { fee_bps });
    Ok(())
}

pub fn handler_set_paused(ctx: Context<AdminOnly>, paused: bool) -> Result<()> {
    let cfg = &mut ctx.accounts.global_config;
    cfg.paused = paused;
    emit!(PauseUpdated { paused });
    Ok(())
}
