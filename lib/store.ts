import { create } from "zustand";
import type { Bet, Round, LeaderboardEntry, LeaderboardPeriod } from "./types";
import { api } from "./api";

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
    try {
      const rounds = await api.getRounds();
      set({ rounds, loading: false });
    } catch (err) {
      console.error("[store] loadRounds failed:", err);
      set({ loading: false });
    }
  },
  loadRound: async (id: string) => {
    set({ loading: true });
    try {
      const round = await api.getRound(id);
      set({ currentRound: round, loading: false });
    } catch (err) {
      console.error("[store] loadRound failed:", err);
      set({ currentRound: null, loading: false });
    }
  },

  // Leaderboard
  leaderboard: [],
  leaderboardPeriod: "weekly",
  setLeaderboardPeriod: async (period: LeaderboardPeriod) => {
    set({ leaderboardPeriod: period, loading: true });
    try {
      const leaderboard = await api.getLeaderboard(period);
      set({ leaderboard, loading: false });
    } catch (err) {
      console.error("[store] setLeaderboardPeriod failed:", err);
      set({ loading: false });
    }
  },

  // Betting
  userBets: [],
  placeBet: async (roundId, tokenId, side, amount) => {
    const bet = await api.placeBet({ roundId, tokenId, side, amount });
    set({ userBets: [bet, ...get().userBets] });
    return bet;
  },

  loading: false,
}));
