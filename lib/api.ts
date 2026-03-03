import type {
  Round,
  Bet,
  User,
  LeaderboardEntry,
  LeaderboardPeriod,
  PlaceBetInput,
  ApiError,
} from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

let getAccessToken: (() => Promise<string | null>) | null = null;

export function setAccessTokenGetter(getter: () => Promise<string | null>) {
  getAccessToken = getter;
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  if (getAccessToken) {
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({
      error: `HTTP ${res.status}`,
      code: "UNKNOWN",
    }));
    throw new ApiClientError(res.status, body);
  }

  return res.json();
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    public body: ApiError
  ) {
    super(body.error);
    this.name = "ApiClientError";
  }
}

export const api = {
  // Rounds (no auth required)
  getRounds: (limit = 10, offset = 0) =>
    apiFetch<Round[]>(`/api/rounds?limit=${limit}&offset=${offset}`),

  getCurrentRound: () =>
    apiFetch<Round>("/api/rounds/current"),

  getRound: (id: string) =>
    apiFetch<Round>(`/api/rounds/${id}`),

  // Bets (auth required)
  placeBet: (data: PlaceBetInput) =>
    apiFetch<Bet & { unsignedTx?: string }>("/api/bets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  confirmBet: (betId: string, txSignature: string) =>
    apiFetch<{ ok: boolean }>(`/api/bets/${betId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ txSignature }),
    }),

  getMyBets: (roundId?: string) =>
    apiFetch<Bet[]>(`/api/bets/mine${roundId ? `?roundId=${roundId}` : ""}`),

  // Solana (auth required)
  getClaimTx: (tokenId: string) =>
    apiFetch<{ unsignedTx: string }>("/api/solana/claim-tx", {
      method: "POST",
      body: JSON.stringify({ tokenId }),
    }),

  confirmClaim: (betId: string, txSignature: string) =>
    apiFetch<{ ok: boolean }>("/api/solana/confirm-claim", {
      method: "POST",
      body: JSON.stringify({ betId, txSignature }),
    }),

  // Leaderboard
  getLeaderboard: (period: LeaderboardPeriod, limit = 20) =>
    apiFetch<LeaderboardEntry[]>(
      `/api/leaderboard?period=${period}&limit=${limit}`
    ),

  // Users (auth required)
  getMe: () => apiFetch<User>("/api/users/me"),

  register: (data: {
    displayName: string;
    walletAddress?: string;
    avatarUrl?: string;
  }) =>
    apiFetch<User>("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
