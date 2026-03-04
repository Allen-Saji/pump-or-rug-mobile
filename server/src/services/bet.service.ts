import { ulid } from "ulid";
import { betRepo } from "../repositories/bet.repo";
import { roundRepo } from "../repositories/round.repo";
import { userRepo } from "../repositories/user.repo";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "../lib/errors";
import type { Bet, PlaceBetInput } from "@pump-or-rug/shared";
import {
  program,
  connection,
  getGlobalConfigPda,
  getRoundPda,
  getVaultPda,
  getBetPositionPda,
  BN,
  PublicKey,
  SystemProgram,
} from "./solana.service";

export const betService = {
  /** Validate + build unsigned tx without saving anything to DB */
  async prepareBet(userId: string, input: PlaceBetInput): Promise<{
    unsignedTx?: string;
    roundId: string;
    tokenId: string;
    tokenTicker: string;
    side: string;
    amount: number;
    onchainRoundId?: number;
  }> {
    const { roundId, tokenId, side, amount } = input;

    const round = roundRepo.getById(roundId);
    if (!round) throw new NotFoundError("Round", roundId);
    if (round.status !== "open") {
      throw new ConflictError("Round is not open for betting");
    }
    if (Date.now() > round.closesAt) {
      throw new ConflictError("Round betting period has ended");
    }

    const tokens = roundRepo.getTokensByRoundId(roundId);
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) {
      throw new ValidationError("Token does not belong to this round");
    }

    if (betRepo.existsForUserAndToken(userId, tokenId)) {
      throw new ConflictError("Already placed a bet on this token");
    }

    if (amount < 0.01 || amount > 1) {
      throw new ValidationError("Bet amount must be between 0.01 and 1 SOL");
    }

    let unsignedTx: string | undefined;
    if (token.onchainRoundId) {
      try {
        const user = userRepo.getById(userId);
        if (user?.walletAddress) {
          unsignedTx = await this.buildPlaceBetTx(
            token.onchainRoundId,
            user.walletAddress,
            side as "pump" | "rug",
            amount
          );
        }
      } catch (err) {
        console.error("[solana] Failed to build place_bet tx:", err);
      }
    }

    return {
      unsignedTx,
      roundId,
      tokenId,
      tokenTicker: token.ticker,
      side,
      amount,
      onchainRoundId: token.onchainRoundId ?? undefined,
    };
  },

  /** Commit bet to DB after on-chain tx succeeds */
  async commitBet(userId: string, input: PlaceBetInput, txSignature?: string): Promise<Bet> {
    const { roundId, tokenId, side, amount } = input;

    // Re-validate (in case state changed between prepare and commit)
    const round = roundRepo.getById(roundId);
    if (!round) throw new NotFoundError("Round", roundId);
    if (round.status !== "open") {
      throw new ConflictError("Round is not open for betting");
    }
    if (Date.now() > round.closesAt) {
      throw new ConflictError("Round betting period has ended");
    }

    const tokens = roundRepo.getTokensByRoundId(roundId);
    const token = tokens.find((t) => t.id === tokenId);
    if (!token) {
      throw new ValidationError("Token does not belong to this round");
    }

    if (betRepo.existsForUserAndToken(userId, tokenId)) {
      throw new ConflictError("Already placed a bet on this token");
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

    // Mark on-chain status if tx signature provided
    if (txSignature) {
      betRepo.updateOnchainStatus(bet.id, txSignature, "confirmed");
    }

    return {
      id: bet.id,
      roundId: bet.roundId,
      tokenId: bet.tokenId,
      tokenTicker: token.ticker,
      side: bet.side as "pump" | "rug",
      amount: bet.amount,
      placedAt: bet.placedAt,
    };
  },

  /** Legacy: place bet directly (kept for non-on-chain fallback) */
  async placeBet(userId: string, input: PlaceBetInput): Promise<Bet & { unsignedTx?: string }> {
    const prepared = await this.prepareBet(userId, input);
    const bet = await this.commitBet(userId, input);
    return { ...bet, unsignedTx: prepared.unsignedTx };
  },

  async buildPlaceBetTx(
    onchainRoundId: number,
    walletAddress: string,
    side: "pump" | "rug",
    amountSol: number
  ): Promise<string> {
    const bettor = new PublicKey(walletAddress);
    const roundId = new BN(onchainRoundId);
    const roundPda = getRoundPda(roundId);
    const vaultPda = getVaultPda(roundPda);
    const betPositionPda = getBetPositionPda(roundPda, bettor);
    const amountLamports = new BN(Math.round(amountSol * 1e9));

    const betSide = side === "pump" ? { pump: {} } : { rug: {} };

    const tx = await program.methods
      .placeBet(roundId, betSide as any, amountLamports)
      .accounts({
        bettor,
        globalConfig: getGlobalConfigPda(),
        round: roundPda,
        vault: vaultPda,
        betPosition: betPositionPda,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = bettor;

    return tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");
  },

  async confirmBet(betId: string, txSignature: string): Promise<void> {
    const bet = betRepo.getById(betId);
    if (!bet) throw new NotFoundError("Bet", betId);
    betRepo.updateOnchainStatus(betId, txSignature, "confirmed");
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
        claimed: !!b.claimTxSignature,
      };
    });
  },
};
