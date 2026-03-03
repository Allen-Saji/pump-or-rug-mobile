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
  POINTS_CORRECT,
  POINTS_STREAK_BONUS,
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

    // Group bets by user for streak tracking
    const userBetResults = new Map<string, boolean[]>();

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

      if (!userBetResults.has(bet.userId)) {
        userBetResults.set(bet.userId, []);
      }
      userBetResults.get(bet.userId)!.push(won);
    }

    betRepo.updateManyResults(betUpdates);

    // Update user stats
    for (const [userId, results] of userBetResults) {
      const wins = results.filter(Boolean).length;
      const user = userRepo.getById(userId);
      if (!user) continue;

      const allWins = results.every(Boolean);
      const newStreak = allWins ? user.winStreak + 1 : 0;
      const streakBonus = allWins ? newStreak * POINTS_STREAK_BONUS : 0;
      const points = wins * POINTS_CORRECT + streakBonus;

      userRepo.incrementStats(userId, {
        points,
        wins,
        bets: results.length,
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
