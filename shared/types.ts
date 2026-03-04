export type TokenPlatform = "pump.fun" | "bags.fm" | "raydium";

export type RoundStatus = "open" | "settling" | "settled" | "cancelled";

export type BetSide = "pump" | "rug";

export type BetResult = "pump" | "rug" | "void" | "no_score";

export interface Token {
  id: string;
  mint: string;
  name: string;
  ticker: string;
  platform: TokenPlatform;
  imageUrl?: string;
  priceAtOpen: number;
  priceAtClose?: number;
  priceChangePercent?: number;
  liquidity?: number;
  marketCap?: number;
  result?: BetResult;
  pumpPool?: number;
  rugPool?: number;
}

export interface Round {
  id: string;
  roundNumber: number;
  status: RoundStatus;
  tokens: Token[];
  opensAt: number;
  closesAt: number;
  settlesAt?: number;
  totalPool: number;
  totalBets: number;
}

export interface Bet {
  id: string;
  roundId: string;
  tokenId: string;
  tokenTicker: string;
  side: BetSide;
  amount: number;
  result?: BetResult;
  payout?: number;
  placedAt: number;
  claimed?: boolean;
}

export interface User {
  id: string;
  walletAddress: string;
  displayName: string;
  avatarUrl?: string;
  points: number;
  rank: number;
  winStreak: number;
  dailyStreak: number;
  totalBets: number;
  totalWins: number;
  bets: Bet[];
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  points: number;
  winStreak: number;
  isCurrentUser?: boolean;
}

export type LeaderboardPeriod = "daily" | "weekly" | "season" | "all-time";

// API request/response types
export interface PlaceBetInput {
  roundId: string;
  tokenId: string;
  side: BetSide;
  amount: number;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string>;
}
