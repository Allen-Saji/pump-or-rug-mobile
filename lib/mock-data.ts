import type {
  Round,
  Token,
  User,
  Bet,
  LeaderboardEntry,
  LeaderboardPeriod,
  Badge,
} from "./types";

// ── Tokens ──────────────────────────────────────────────────

const mockTokens: Token[] = [
  {
    id: "t1",
    name: "Boden",
    ticker: "$BODEN",
    platform: "pump.fun",
    priceAtOpen: 0.0042,
    liquidity: 185_000,
  },
  {
    id: "t2",
    name: "Popcat",
    ticker: "$POPCAT",
    platform: "raydium",
    priceAtOpen: 1.23,
    liquidity: 2_400_000,
  },
  {
    id: "t3",
    name: "dogwifhat",
    ticker: "$WIF",
    platform: "raydium",
    priceAtOpen: 2.85,
    liquidity: 12_000_000,
  },
  {
    id: "t4",
    name: "Bonk",
    ticker: "$BONK",
    platform: "raydium",
    priceAtOpen: 0.000028,
    liquidity: 8_500_000,
  },
  {
    id: "t5",
    name: "Gigachad",
    ticker: "$GIGA",
    platform: "pump.fun",
    priceAtOpen: 0.068,
    liquidity: 420_000,
  },
  {
    id: "t6",
    name: "Moo Deng",
    ticker: "$MOODENG",
    platform: "pump.fun",
    priceAtOpen: 0.31,
    liquidity: 890_000,
  },
  {
    id: "t7",
    name: "Tremp",
    ticker: "$TREMP",
    platform: "bags.fm",
    priceAtOpen: 0.52,
    liquidity: 310_000,
  },
  {
    id: "t8",
    name: "Brett",
    ticker: "$BRETT",
    platform: "pump.fun",
    priceAtOpen: 0.17,
    liquidity: 1_200_000,
  },
  {
    id: "t9",
    name: "Myro",
    ticker: "$MYRO",
    platform: "raydium",
    priceAtOpen: 0.14,
    liquidity: 560_000,
  },
  {
    id: "t10",
    name: "Slerf",
    ticker: "$SLERF",
    platform: "pump.fun",
    priceAtOpen: 0.38,
    liquidity: 720_000,
  },
  {
    id: "t11",
    name: "Wen",
    ticker: "$WEN",
    platform: "bags.fm",
    priceAtOpen: 0.00012,
    liquidity: 340_000,
  },
  {
    id: "t12",
    name: "Jeo Boden",
    ticker: "$JEO",
    platform: "pump.fun",
    priceAtOpen: 0.0089,
    liquidity: 95_000,
  },
];

// ── Rounds ──────────────────────────────────────────────────

const now = Date.now();
const MINUTE = 60_000;

export const mockRounds: Round[] = [
  {
    id: "r1",
    roundNumber: 42,
    status: "open",
    tokens: [
      { ...mockTokens[0] },
      { ...mockTokens[4] },
      { ...mockTokens[6] },
      { ...mockTokens[9] },
    ],
    opensAt: now - 3 * MINUTE,
    closesAt: now + 7 * MINUTE,
    totalPool: 24.5,
    totalBets: 18,
  },
  {
    id: "r2",
    roundNumber: 41,
    status: "settling",
    tokens: [
      { ...mockTokens[1], priceAtClose: 1.41, priceChangePercent: 14.6 },
      { ...mockTokens[3], priceAtClose: 0.000031, priceChangePercent: 10.7 },
      { ...mockTokens[5], priceAtClose: 0.22, priceChangePercent: -29.0 },
      { ...mockTokens[7], priceAtClose: 0.15, priceChangePercent: -11.8 },
    ],
    opensAt: now - 20 * MINUTE,
    closesAt: now - 10 * MINUTE,
    settlesAt: now + 2 * MINUTE,
    totalPool: 42.1,
    totalBets: 31,
  },
  {
    id: "r3",
    roundNumber: 40,
    status: "settled",
    tokens: [
      {
        ...mockTokens[2],
        priceAtClose: 3.12,
        priceChangePercent: 9.5,
        result: "pump",
      },
      {
        ...mockTokens[8],
        priceAtClose: 0.08,
        priceChangePercent: -42.9,
        result: "rug",
      },
      {
        ...mockTokens[10],
        priceAtClose: 0.00013,
        priceChangePercent: 8.3,
        result: "pump",
      },
      {
        ...mockTokens[11],
        priceAtClose: 0.0091,
        priceChangePercent: 2.2,
        result: "no_score",
      },
    ],
    opensAt: now - 40 * MINUTE,
    closesAt: now - 30 * MINUTE,
    settlesAt: now - 20 * MINUTE,
    totalPool: 38.7,
    totalBets: 27,
  },
  {
    id: "r4",
    roundNumber: 39,
    status: "settled",
    tokens: [
      {
        ...mockTokens[1],
        priceAtClose: 1.05,
        priceChangePercent: -14.6,
        result: "rug",
      },
      {
        ...mockTokens[4],
        priceAtClose: 0.042,
        priceChangePercent: -38.2,
        result: "rug",
      },
      {
        ...mockTokens[6],
        priceAtClose: 0.71,
        priceChangePercent: 36.5,
        result: "pump",
      },
      {
        ...mockTokens[9],
        priceAtClose: 0.39,
        priceChangePercent: 2.6,
        result: "void",
      },
    ],
    opensAt: now - 60 * MINUTE,
    closesAt: now - 50 * MINUTE,
    settlesAt: now - 40 * MINUTE,
    totalPool: 51.2,
    totalBets: 35,
  },
];

// ── User Bets ───────────────────────────────────────────────

const mockBets: Bet[] = [
  {
    id: "b1",
    roundId: "r3",
    tokenId: "t3",
    tokenTicker: "$WIF",
    side: "pump",
    amount: 1.0,
    result: "pump",
    payout: 1.85,
    placedAt: now - 35 * MINUTE,
  },
  {
    id: "b2",
    roundId: "r3",
    tokenId: "t9",
    tokenTicker: "$MYRO",
    side: "pump",
    amount: 0.5,
    result: "rug",
    payout: 0,
    placedAt: now - 34 * MINUTE,
  },
  {
    id: "b3",
    roundId: "r4",
    tokenId: "t7",
    tokenTicker: "$TREMP",
    side: "pump",
    amount: 2.0,
    result: "pump",
    payout: 3.6,
    placedAt: now - 55 * MINUTE,
  },
  {
    id: "b4",
    roundId: "r4",
    tokenId: "t5",
    tokenTicker: "$GIGA",
    side: "rug",
    amount: 1.5,
    result: "rug",
    payout: 2.7,
    placedAt: now - 54 * MINUTE,
  },
];

// ── Badges ──────────────────────────────────────────────────

const mockBadges: Badge[] = [
  {
    id: "bg1",
    name: "First Blood",
    description: "Place your first bet",
    icon: "knife",
    earnedAt: now - 3 * 24 * 60 * MINUTE,
  },
  {
    id: "bg2",
    name: "Hot Streak",
    description: "Win 5 bets in a row",
    icon: "fire",
    earnedAt: now - 1 * 24 * 60 * MINUTE,
  },
  {
    id: "bg3",
    name: "Degen Hours",
    description: "Place a bet between 2-5 AM",
    icon: "moon",
    earnedAt: now - 2 * 24 * 60 * MINUTE,
  },
];

// ── Mock User ───────────────────────────────────────────────

export const mockUser: User = {
  id: "u1",
  walletAddress: "7xKX...9fGh",
  displayName: "degen_whale.sol",
  points: 4_250,
  rank: 7,
  winStreak: 3,
  dailyStreak: 5,
  totalBets: 42,
  totalWins: 26,
  bets: mockBets,
  badges: mockBadges,
};

// ── Leaderboard ─────────────────────────────────────────────

const leaderboardNames = [
  "sol_maxi_69",
  "rugged_again",
  "pump_hunter",
  "jeets_r_us",
  "diamond_paws",
  "ser_dumps_alot",
  "degen_whale.sol",
  "ape_together",
  "floor_is_lava",
  "ngmi_capital",
  "wagmi_fund",
  "chad_dev",
  "paper_hands_pete",
  "moon_or_dust",
  "bag_holder_bob",
  "cope_dealer",
  "fomo_king",
  "rekt_capital",
  "alpha_leaker",
  "sniper_bot_9000",
];

function generateLeaderboard(): LeaderboardEntry[] {
  return leaderboardNames.map((name, i) => ({
    rank: i + 1,
    userId: `u${i + 1}`,
    displayName: name,
    points: Math.round(10_000 - i * 350 + Math.random() * 100),
    winStreak: Math.max(0, Math.round(12 - i * 0.5 + Math.random() * 3)),
    isCurrentUser: name === "degen_whale.sol",
  }));
}

const leaderboardCache = generateLeaderboard();

// ── API-like functions ──────────────────────────────────────

export async function fetchRounds(): Promise<Round[]> {
  await delay(300);
  return mockRounds;
}

export async function fetchRound(id: string): Promise<Round | undefined> {
  await delay(200);
  return mockRounds.find((r) => r.id === id);
}

export async function fetchLeaderboard(
  _period: LeaderboardPeriod
): Promise<LeaderboardEntry[]> {
  await delay(400);
  return leaderboardCache;
}

export async function fetchUser(): Promise<User> {
  await delay(200);
  return mockUser;
}

export async function placeBet(
  roundId: string,
  tokenId: string,
  side: "pump" | "rug",
  amount: number
): Promise<Bet> {
  await delay(500);
  const bet: Bet = {
    id: `b${Date.now()}`,
    roundId,
    tokenId,
    tokenTicker: mockTokens.find((t) => t.id === tokenId)?.ticker ?? "???",
    side,
    amount,
    placedAt: Date.now(),
  };
  mockUser.bets.unshift(bet);
  mockUser.totalBets++;
  return bet;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
