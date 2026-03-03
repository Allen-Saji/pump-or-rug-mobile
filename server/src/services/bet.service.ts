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
  async placeBet(userId: string, input: PlaceBetInput): Promise<Bet & { unsignedTx?: string }> {
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

    // Construct unsigned on-chain transaction if token has on-chain round
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
      id: bet.id,
      roundId: bet.roundId,
      tokenId: bet.tokenId,
      tokenTicker: token.ticker,
      side: bet.side,
      amount: bet.amount,
      placedAt: bet.placedAt,
      unsignedTx,
    };
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
