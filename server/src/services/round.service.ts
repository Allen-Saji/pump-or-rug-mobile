import { ulid } from "ulid";
import { roundRepo } from "../repositories/round.repo";
import { tokenService } from "./token.service";
import { priceService } from "./price.service";
import { betRepo } from "../repositories/bet.repo";
import { userRepo } from "../repositories/user.repo";
import {
  ROUND_DURATION_MS,
  PUMP_THRESHOLD,
  RUG_THRESHOLD,
  POINTS_WIN,
  POINTS_LOSS,
  POINTS_STREAK_BONUS,
  POINTS_PERFECT_ROUND_MULTIPLIER,
  POINTS_RUG_SNIPER_BONUS,
  RUG_SNIPER_THRESHOLD,
} from "../lib/config";
import type { Token, Round, BetResult, TokenPlatform } from "@pump-or-rug/shared";

export const roundService = {
  generateRound(): Round | null {
    // Idempotency: compute round number from hour timestamp
    const now = Date.now();
    const hourTimestamp = Math.floor(now / ROUND_DURATION_MS) * ROUND_DURATION_MS;
    const roundNumber = Math.floor(hourTimestamp / ROUND_DURATION_MS);

    // Check if round already exists for this hour
    const existing = roundRepo.getByRoundNumber(roundNumber);
    if (existing) {
      console.log(`[round] Round ${roundNumber} already exists, skipping`);
      const tokens = roundRepo.getTokensByRoundId(existing.id);
      return mapToRound(existing, tokens.map(mapTokenRow));
    }

    // Select tokens
    const candidates = tokenService.selectTokensForRound();
    if (candidates.length < 2) {
      console.warn(`[round] Only ${candidates.length} eligible tokens, cancelling`);
      return null;
    }

    const roundId = ulid();
    const opensAt = hourTimestamp;
    const closesAt = hourTimestamp + ROUND_DURATION_MS;

    const tokenRows = candidates.map((c) => ({
      id: ulid(),
      roundId,
      mint: c.mint,
      name: c.name,
      ticker: c.ticker,
      platform: c.platform,
      imageUrl: c.imageUrl ?? null,
      priceAtOpen: c.price,
      priceAtClose: null,
      priceChangePercent: null,
      liquidity: c.liquidity,
      marketCap: c.marketCap,
      result: null,
    }));

    roundRepo.create(
      {
        id: roundId,
        roundNumber,
        status: "open",
        opensAt,
        closesAt,
        settlesAt: null,
        totalPool: 0,
        totalBets: 0,
      },
      tokenRows
    );

    console.log(
      `[round] Created round ${roundNumber} with ${tokenRows.length} tokens`
    );

    return {
      id: roundId,
      roundNumber,
      status: "open",
      tokens: tokenRows.map((t) => ({
        id: t.id,
        mint: t.mint,
        name: t.name,
        ticker: t.ticker,
        platform: t.platform as TokenPlatform,
        imageUrl: t.imageUrl ?? undefined,
        priceAtOpen: t.priceAtOpen,
        liquidity: t.liquidity ?? undefined,
        marketCap: t.marketCap ?? undefined,
      })),
      opensAt,
      closesAt,
      totalPool: 0,
      totalBets: 0,
    };
  },

  async settleUnsettledRounds(): Promise<number> {
    const unsettled = roundRepo.getUnsettled();
    let settled = 0;

    for (const round of unsettled) {
      try {
        await this.settleRound(round.id);
        settled++;
      } catch (err) {
        console.error(`[round] Failed to settle round ${round.id}:`, err);
      }
    }

    return settled;
  },

  async settleRound(roundId: string): Promise<void> {
    const round = roundRepo.getById(roundId);
    if (!round || round.status !== "open") return;

    roundRepo.updateStatus(roundId, "settling");

    const tokens = roundRepo.getTokensByRoundId(roundId);
    const priceRequests = tokens.map((t) => ({
      mint: t.mint,
      platform: t.platform as TokenPlatform,
    }));

    const closePrices = await priceService.getClosePrices(priceRequests);

    // Update each token's result
    for (const token of tokens) {
      const closePrice = closePrices.get(token.mint);

      if (closePrice === null || closePrice === undefined) {
        // Price fetch failed → void
        roundRepo.updateTokenResult(token.id, 0, 0, "void");
        continue;
      }

      const changePercent =
        ((closePrice - token.priceAtOpen) / token.priceAtOpen) * 100;

      let result: BetResult;
      if (changePercent >= PUMP_THRESHOLD) {
        result = "pump";
      } else if (changePercent <= RUG_THRESHOLD) {
        result = "rug";
      } else {
        result = "no_score";
      }

      roundRepo.updateTokenResult(token.id, closePrice, changePercent, result);
    }

    // Settle bets
    const allBets = betRepo.getByRound(roundId);
    const updatedTokens = roundRepo.getTokensByRoundId(roundId);
    const tokenResultMap = new Map(updatedTokens.map((t) => [t.id, t.result]));

    // Track per-user bet outcomes for scoring
    const userBetOutcomes = new Map<
      string,
      { won: boolean; tokenId: string }[]
    >();

    const betUpdates: { id: string; result: string; payout: number }[] = [];

    for (const bet of allBets) {
      const tokenResult = tokenResultMap.get(bet.tokenId);

      if (!tokenResult || tokenResult === "void") {
        betUpdates.push({ id: bet.id, result: "void", payout: bet.amount }); // refund
        continue;
      }

      if (tokenResult === "no_score") {
        betUpdates.push({ id: bet.id, result: "no_score", payout: bet.amount }); // refund
        continue;
      }

      const won = bet.side === tokenResult;
      const payout = won ? bet.amount * 1.85 : 0;

      betUpdates.push({ id: bet.id, result: tokenResult, payout });

      if (!userBetOutcomes.has(bet.userId)) {
        userBetOutcomes.set(bet.userId, []);
      }
      userBetOutcomes.get(bet.userId)!.push({ won, tokenId: bet.tokenId });
    }

    betRepo.updateManyResults(betUpdates);

    // Build token change % lookup for rug sniper bonus
    const tokenChangeMap = new Map(
      updatedTokens.map((t) => [t.id, t.priceChangePercent ?? 0])
    );

    // Update user stats with new scoring
    for (const [userId, outcomes] of userBetOutcomes) {
      const user = userRepo.getById(userId);
      if (!user) continue;

      const wins = outcomes.filter((o) => o.won).length;
      const losses = outcomes.length - wins;
      const allWon = outcomes.length > 0 && outcomes.every((o) => o.won);

      // Base points: +5 per win, -3 per loss
      let points = wins * POINTS_WIN + losses * POINTS_LOSS;

      // Streak bonus: +2 per consecutive win (stacks with current streak)
      const newStreak = allWon ? user.winStreak + 1 : 0;
      if (allWon) {
        points += newStreak * POINTS_STREAK_BONUS;
      }

      // Perfect round: 2x multiplier if called every token correctly
      if (allWon && outcomes.length >= 2) {
        points *= POINTS_PERFECT_ROUND_MULTIPLIER;
      }

      // Rug sniper: +3 bonus for correctly calling a heavy rug (>25% drop)
      for (const outcome of outcomes) {
        if (!outcome.won) continue;
        const change = tokenChangeMap.get(outcome.tokenId) ?? 0;
        if (change <= RUG_SNIPER_THRESHOLD) {
          points += POINTS_RUG_SNIPER_BONUS;
        }
      }

      // Floor at 0 to prevent negative total points
      const clampedPoints = Math.max(points, -user.points);

      userRepo.incrementStats(userId, {
        points: clampedPoints,
        wins,
        bets: outcomes.length,
        winStreak: newStreak,
      });
    }

    roundRepo.updateStatus(roundId, "settled", Date.now());
    console.log(`[round] Settled round ${roundId}, ${allBets.length} bets processed`);
  },

  getRound(id: string): Round | null {
    const round = roundRepo.getById(id);
    if (!round) return null;
    const tokens = roundRepo.getTokensByRoundId(id);
    return mapToRound(round, tokens.map(mapTokenRow));
  },

  getCurrentRound(): Round | null {
    const round = roundRepo.getCurrentOpen();
    if (!round) return null;
    const tokens = roundRepo.getTokensByRoundId(round.id);
    return mapToRound(round, tokens.map(mapTokenRow));
  },

  getRecentRounds(limit: number, offset: number): Round[] {
    const rows = roundRepo.getRecent(limit, offset);
    return rows.map((r) => {
      const tokens = roundRepo.getTokensByRoundId(r.id);
      return mapToRound(r, tokens.map(mapTokenRow));
    });
  },
};

function mapTokenRow(row: any): Token {
  return {
    id: row.id,
    mint: row.mint,
    name: row.name,
    ticker: row.ticker,
    platform: row.platform,
    imageUrl: row.imageUrl ?? undefined,
    priceAtOpen: row.priceAtOpen,
    priceAtClose: row.priceAtClose ?? undefined,
    priceChangePercent: row.priceChangePercent ?? undefined,
    liquidity: row.liquidity ?? undefined,
    marketCap: row.marketCap ?? undefined,
    result: row.result ?? undefined,
  };
}

function mapToRound(row: any, tokens: Token[]): Round {
  return {
    id: row.id,
    roundNumber: row.roundNumber,
    status: row.status,
    tokens,
    opensAt: row.opensAt,
    closesAt: row.closesAt,
    settlesAt: row.settlesAt ?? undefined,
    totalPool: row.totalPool,
    totalBets: row.totalBets,
  };
}
