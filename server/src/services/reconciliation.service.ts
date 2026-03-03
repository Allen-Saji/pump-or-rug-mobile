import { eq, and, lt, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { bets, roundTokens } from "../db/schema";
import {
  program,
  adminKeypair,
  getGlobalConfigPda,
  getRoundPda,
  getVaultPda,
  BN,
  PublicKey,
} from "./solana.service";

const STALE_BET_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const reconciliationService = {
  /**
   * Mark bets as "failed" if they've been pending for too long
   * (user never signed the on-chain transaction)
   */
  cleanStaleBets(): number {
    const cutoff = Date.now() - STALE_BET_THRESHOLD_MS;
    const result = db
      .update(bets)
      .set({ onchainStatus: "failed" })
      .where(
        and(
          eq(bets.onchainStatus, "pending"),
          lt(bets.placedAt, cutoff),
          isNull(bets.txSignature)
        )
      )
      .run();

    return result.changes;
  },

  /**
   * Sweep accumulated fees from resolved on-chain rounds to treasury
   */
  async sweepFees(): Promise<number> {
    // Find tokens with on-chain rounds that are resolved
    const tokens = db
      .select()
      .from(roundTokens)
      .where(
        and(
          // Only tokens with on-chain rounds
          // onchainRoundId is not null
        )
      )
      .all()
      .filter((t) => t.onchainRoundId !== null);

    let swept = 0;
    for (const token of tokens) {
      if (!token.onchainRoundId) continue;
      try {
        const onchainId = new BN(token.onchainRoundId);
        const roundPda = getRoundPda(onchainId);
        const vaultPda = getVaultPda(roundPda);

        // Check if round is resolved and has uncollected fees
        const roundAccount = await program.account.round.fetch(roundPda);
        if (
          roundAccount.feesCollectedLamports.gtn(0) &&
          (roundAccount.status as any).resolved !== undefined
        ) {
          await program.methods
            .sweepFees(onchainId)
            .accounts({
              admin: adminKeypair.publicKey,
              globalConfig: getGlobalConfigPda(),
              round: roundPda,
              vault: vaultPda,
              treasury: adminKeypair.publicKey,
            })
            .signers([adminKeypair])
            .rpc();

          console.log(`[reconciliation] Swept fees for round ${onchainId}`);
          swept++;
        }
      } catch {
        // Round may not exist or already swept — ignore
      }
    }

    return swept;
  },
};
