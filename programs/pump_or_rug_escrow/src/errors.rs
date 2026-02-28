use anchor_lang::prelude::*;

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
    #[msg("All positions must be claimed before closing")]
    ClaimsPending,
    #[msg("Invalid grace period")]
    InvalidGracePeriod,
    #[msg("Grace period not elapsed")]
    GracePeriodNotElapsed,
}
