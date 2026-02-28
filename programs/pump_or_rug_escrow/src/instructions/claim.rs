use anchor_lang::prelude::*;
use crate::constants::*;
use crate::errors::PumpOrRugError;
use crate::events::Claimed;
use crate::helpers::{compute_winner_payout, transfer_from_vault};
use crate::state::*;

#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

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

    // H1 fix: close bet_position after claim to reclaim rent.
    // Re-init is prevented because place_bet requires round.status == Open,
    // and a resolved/closed round can never transition back to Open.
    #[account(
        mut,
        close = user,
        seeds = [SEED_BET, round.key().as_ref(), user.key().as_ref()],
        bump = bet_position.bump,
        constraint = bet_position.user == user.key() @ PumpOrRugError::Unauthorized,
        constraint = bet_position.round == round.key() @ PumpOrRugError::Unauthorized,
    )]
    pub bet_position: Account<'info, BetPosition>,

    pub system_program: Program<'info, System>,
}

// L2 note: claim intentionally does NOT check global_config.paused.
// Users must always be able to withdraw their funds regardless of pause state.
pub fn handler(ctx: Context<Claim>, _round_id: u64) -> Result<()> {
    let round = &mut ctx.accounts.round;
    let pos = &ctx.accounts.bet_position;

    // C1 fix: allow claims on both Resolved and Closed rounds.
    // After force_close_round (which only sweeps fees), users can still claim.
    require!(
        round.status == RoundStatus::Resolved || round.status == RoundStatus::Closed,
        PumpOrRugError::RoundNotResolved
    );
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

                // C2 fix: use fee_bps snapshot from round creation, not current GlobalConfig
                let (payout_amount, fee) = compute_winner_payout(
                    pos.amount_lamports,
                    winner_pool,
                    loser_pool,
                    round.fee_bps,
                )?;

                payout = payout_amount;
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
        transfer_from_vault(
            &ctx.accounts.vault.to_account_info(),
            &ctx.accounts.user.to_account_info(),
            &ctx.accounts.system_program.to_account_info(),
            &round_key,
            round.vault_bump,
            payout,
        )?;
    }

    // Note: pos.claimed is set for accounting, but the account is closed
    // after this handler via Anchor's `close = user` constraint.
    round.claimed_positions = round
        .claimed_positions
        .checked_add(1)
        .ok_or(PumpOrRugError::MathOverflow)?;

    emit!(Claimed {
        round: round.key(),
        user: ctx.accounts.user.key(),
        payout_lamports: payout,
    });
    Ok(())
}
