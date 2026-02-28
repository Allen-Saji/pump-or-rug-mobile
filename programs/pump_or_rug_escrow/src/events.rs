use anchor_lang::prelude::*;
use crate::state::{BetSide, RoundOutcome};

#[event]
pub struct ConfigInitialized {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub fee_bps: u16,
}

#[event]
pub struct ResolverUpdated {
    pub resolver: Pubkey,
}

#[event]
pub struct TreasuryUpdated {
    pub treasury: Pubkey,
}

#[event]
pub struct FeeUpdated {
    pub fee_bps: u16,
}

#[event]
pub struct PauseUpdated {
    pub paused: bool,
}

#[event]
pub struct RoundCreated {
    pub round: Pubkey,
    pub round_id: u64,
    pub open_ts: i64,
    pub close_ts: i64,
    pub settle_ts: i64,
}

#[event]
pub struct BetPlaced {
    pub round: Pubkey,
    pub user: Pubkey,
    pub side: BetSide,
    pub amount_lamports: u64,
}

#[event]
pub struct RoundResolved {
    pub round: Pubkey,
    pub outcome: RoundOutcome,
}

#[event]
pub struct RoundCancelled {
    pub round: Pubkey,
}

#[event]
pub struct Claimed {
    pub round: Pubkey,
    pub user: Pubkey,
    pub payout_lamports: u64,
}

#[event]
pub struct FeesSwept {
    pub round: Pubkey,
    pub amount_lamports: u64,
}

#[event]
pub struct RoundClosed {
    pub round: Pubkey,
    pub residual_swept_lamports: u64,
}

#[event]
pub struct RoundForceClosed {
    pub round: Pubkey,
    pub residual_swept_lamports: u64,
    pub grace_seconds: i64,
}
