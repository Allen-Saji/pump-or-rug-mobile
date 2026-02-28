use anchor_lang::prelude::*;

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
    pub total_positions: u32,
    pub claimed_positions: u32,
    pub fee_bps: u16, // snapshot from GlobalConfig at creation (C2 fix)
    pub bump: u8,
    pub vault_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum RoundStatus {
    Open,
    Resolved,
    Closed,
    // M1: removed dead `Cancelled` variant (was never assigned)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace, PartialEq, Eq)]
pub enum RoundOutcome {
    Unknown,
    Pump,
    Rug,
    NoScore,
    Void,
}
