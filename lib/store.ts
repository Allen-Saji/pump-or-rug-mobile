import { create } from "zustand";
import type { Bet, Round, LeaderboardEntry, LeaderboardPeriod } from "./types";
import {
  fetchRounds,
  fetchRound,
  fetchLeaderboard,
  placeBet as mockPlaceBet,
} from "./mock-data";

interface AppState {
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
  userBets: Bet[];
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
  userBets: [],
  placeBet: async (roundId, tokenId, side, amount) => {
    const bet = await mockPlaceBet(roundId, tokenId, side, amount);
    set({ userBets: [bet, ...get().userBets] });
    return bet;
  },

  loading: false,
}));
