import { create } from "zustand";
import type { User, Bet, Round, LeaderboardEntry, LeaderboardPeriod } from "./types";
import {
  fetchRounds,
  fetchRound,
  fetchLeaderboard,
  fetchUser,
  placeBet as mockPlaceBet,
} from "./mock-data";

interface AppState {
  // Wallet
  walletConnected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;

  // User
  user: User | null;
  loadUser: () => Promise<void>;

  // Rounds
  rounds: Round[];
  currentRound: Round | null;
  loadRounds: () => Promise<void>;
  loadRound: (id: string) => Promise<void>;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  leaderboardPeriod: LeaderboardPeriod;
  setLeaderboardPeriod: (period: LeaderboardPeriod) => Promise<void>;

  // Betting
  placeBet: (
    roundId: string,
    tokenId: string,
    side: "pump" | "rug",
    amount: number
  ) => Promise<Bet>;

  // Loading states
  loading: boolean;
}

export const useStore = create<AppState>((set, get) => ({
  // Wallet
  walletConnected: false,
  connectWallet: () => set({ walletConnected: true }),
  disconnectWallet: () => set({ walletConnected: false }),

  // User
  user: null,
  loadUser: async () => {
    const user = await fetchUser();
    set({ user });
  },

  // Rounds
  rounds: [],
  currentRound: null,
  loadRounds: async () => {
    set({ loading: true });
    const rounds = await fetchRounds();
    set({ rounds, loading: false });
  },
  loadRound: async (id: string) => {
    set({ loading: true });
    const round = await fetchRound(id);
    set({ currentRound: round ?? null, loading: false });
  },

  // Leaderboard
  leaderboard: [],
  leaderboardPeriod: "weekly",
  setLeaderboardPeriod: async (period: LeaderboardPeriod) => {
    set({ leaderboardPeriod: period, loading: true });
    const leaderboard = await fetchLeaderboard(period);
    set({ leaderboard, loading: false });
  },

  // Betting
  placeBet: async (roundId, tokenId, side, amount) => {
    const bet = await mockPlaceBet(roundId, tokenId, side, amount);
    const user = get().user;
    if (user) {
      set({
        user: {
          ...user,
          bets: [bet, ...user.bets],
          totalBets: user.totalBets + 1,
          points: user.points + Math.round(amount * 100),
        },
      });
    }
    return bet;
  },

  loading: false,
}));
