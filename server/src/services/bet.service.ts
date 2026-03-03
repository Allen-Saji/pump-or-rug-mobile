import { ulid } from "ulid";
import { betRepo } from "../repositories/bet.repo";
import { roundRepo } from "../repositories/round.repo";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../lib/errors";
import type { Bet, PlaceBetInput } from "@pump-or-rug/shared";

export const betService = {
  placeBet(userId: string, input: PlaceBetInput): Bet {
    const { roundId, tokenId, side, amount } = input;

    // Validate round exists and is open
    const round = roundRepo.getById(roundId);
    if (!round) throw new NotFoundError("Round", roundId);
    if (round.status !== "open") {
      throw new ConflictError("Round is not open for betting");
    }
    if (Date.now() > round.closesAt) {
      throw new ConflictError("Round betting period has ended");
    }

    // Validate token belongs to round
    const tokens = roundRepo.getTokensByRoundId(roundId);
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) {
      throw new ValidationError("Token does not belong to this round");
    }

    // Validate no duplicate bet on same token
    if (betRepo.existsForUserAndToken(userId, tokenId)) {
      throw new ConflictError("Already placed a bet on this token");
    }

    // Validate amount
    if (amount < 0.01 || amount > 1) {
      throw new ValidationError("Bet amount must be between 0.01 and 1 SOL");
    }

    const bet = {
      id: ulid(),
      userId,
      roundId,
      tokenId,
      side,
      amount,
      result: null,
      payout: null,
      placedAt: Date.now(),
    };

    betRepo.create(bet);

    // Update round pool
    roundRepo.updatePool(
      roundId,
      round.totalPool + amount,
      round.totalBets + 1
    );

    return {
      id: bet.id,
      roundId: bet.roundId,
      tokenId: bet.tokenId,
      tokenTicker: token.ticker,
      side: bet.side,
      amount: bet.amount,
      placedAt: bet.placedAt,
    };
  },

  getUserBets(userId: string, roundId?: string): Bet[] {
    const rows = roundId
      ? betRepo.getByUserAndRound(userId, roundId)
      : betRepo.getByUser(userId);

    // Enrich with token ticker
    return rows.map((b) => {
      const tokens = roundRepo.getTokensByRoundId(b.roundId);
      const token = tokens.find((t) => t.id === b.tokenId);
      return {
        id: b.id,
        roundId: b.roundId,
        tokenId: b.tokenId,
        tokenTicker: token?.ticker ?? "???",
        side: b.side as "pump" | "rug",
        amount: b.amount,
        result: b.result as any,
        payout: b.payout ?? undefined,
        placedAt: b.placedAt,
      };
    });
  },
};
