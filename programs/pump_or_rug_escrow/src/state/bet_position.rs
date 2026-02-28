use anchor_lang::prelude::*;

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
