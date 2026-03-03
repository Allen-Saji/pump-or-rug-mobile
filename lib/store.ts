import { create } from "zustand";
import type { Bet, Round, LeaderboardEntry, LeaderboardPeriod } from "./types";
import { api } from "./api";

// Signer function: takes base64 unsigned tx, returns tx signature string
export type SolanaSignAndSend = (
  unsignedTxBase64: string
) => Promise<string>;

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
  loadUserBets: (roundId?: string) => Promise<void>;
  placeBet: (
    roundId: string,
    tokenId: string,
    side: "pump" | "rug",
    amount: number,
    signAndSend?: SolanaSignAndSend
  ) => Promise<Bet>;
  claimBet: (
    bet: Bet,
    signAndSend: SolanaSignAndSend
  ) => Promise<void>;

  // Loading states
  loading: boolean;
  claiming: string | null; // bet ID currently being claimed
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
  loadUserBets: async (roundId) => {
    try {
      const bets = await api.getMyBets(roundId);
      set({ userBets: bets });
    } catch (err) {
      console.error("[store] loadUserBets failed:", err);
    }
  },
  placeBet: async (roundId, tokenId, side, amount, signAndSend) => {
    const result = await api.placeBet({ roundId, tokenId, side, amount });
    const { unsignedTx, ...bet } = result;

    // Sign and submit on-chain transaction if available
    if (unsignedTx && signAndSend) {
      try {
        const txSig = await signAndSend(unsignedTx);
        await api.confirmBet(bet.id, txSig);
        console.log("[store] Bet confirmed on-chain:", txSig);
      } catch (err) {
        console.error("[store] On-chain bet signing failed:", err);
        // DB bet still exists — user can retry signing later
      }
    }

    set({ userBets: [bet, ...get().userBets] });
    return bet;
  },

  claimBet: async (bet, signAndSend) => {
    set({ claiming: bet.id });
    try {
      // Get unsigned claim tx from server
      const { unsignedTx } = await api.getClaimTx(bet.tokenId);

      // Sign and submit on-chain
      const txSig = await signAndSend(unsignedTx);

      // Confirm with server
      await api.confirmClaim(bet.id, txSig);

      // Update local state
      set({
        userBets: get().userBets.map((b) =>
          b.id === bet.id ? { ...b, claimed: true } : b
        ),
        claiming: null,
      });

      console.log("[store] Claim confirmed:", txSig);
    } catch (err) {
      set({ claiming: null });
      throw err;
    }
  },

  loading: false,
  claiming: null,
}));
