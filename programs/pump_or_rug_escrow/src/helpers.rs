use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};
use crate::errors::PumpOrRugError;
use crate::constants::SEED_VAULT;

pub fn compute_winner_payout(
    user_stake: u64,
    winner_pool: u64,
    loser_pool: u64,
    fee_bps: u16,
) -> Result<(u64, u64)> {
    require!(winner_pool > 0, PumpOrRugError::InvalidPoolState);

    let profit_share_u128 = (loser_pool as u128)
        .checked_mul(user_stake as u128)
        .ok_or(PumpOrRugError::MathOverflow)?
        .checked_div(winner_pool as u128)
        .ok_or(PumpOrRugError::MathOverflow)?;

    // C3 fix: guarded u128→u64 cast (safe because profit_share <= loser_pool,
    // but defense-in-depth against future changes)
    let profit_share = u64::try_from(profit_share_u128)
        .map_err(|_| error!(PumpOrRugError::MathOverflow))?;

    let fee_u128 = (profit_share as u128)
        .checked_mul(fee_bps as u128)
        .ok_or(PumpOrRugError::MathOverflow)?
        .checked_div(10_000)
        .ok_or(PumpOrRugError::MathOverflow)?;

    let fee = u64::try_from(fee_u128)
        .map_err(|_| error!(PumpOrRugError::MathOverflow))?;

    let net_profit = profit_share
        .checked_sub(fee)
        .ok_or(PumpOrRugError::MathOverflow)?;

    let payout = user_stake
        .checked_add(net_profit)
        .ok_or(PumpOrRugError::MathOverflow)?;

    Ok((payout, fee))
}

pub fn transfer_from_vault<'info>(
    vault: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    round_key: &Pubkey,
    vault_bump: u8,
    amount: u64,
) -> Result<()> {
    let signer_seeds: &[&[u8]] = &[SEED_VAULT, round_key.as_ref(), &[vault_bump]];
    transfer(
        CpiContext::new_with_signer(
            system_program.clone(),
            Transfer {
                from: vault.clone(),
                to: to.clone(),
            },
            &[signer_seeds],
        ),
        amount,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn payout_formula_happy_path() {
        let (payout, fee) = compute_winner_payout(1_000_000_000, 4_000_000_000, 2_000_000_000, 500)
            .expect("should compute");
        assert_eq!(fee, 25_000_000);
        assert_eq!(payout, 1_475_000_000);
    }

    #[test]
    fn payout_formula_zero_fee() {
        let (payout, fee) = compute_winner_payout(100, 1000, 1000, 0).expect("should compute");
        assert_eq!(fee, 0);
        assert_eq!(payout, 200);
    }

    #[test]
    fn payout_formula_rejects_zero_winner_pool() {
        assert!(compute_winner_payout(100, 0, 1000, 500).is_err());
    }
}
