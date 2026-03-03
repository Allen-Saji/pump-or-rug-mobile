import { Hono } from "hono";
import { z } from "zod";
import { authMiddleware, type AuthContext } from "../middleware/auth";
import { betRepo } from "../repositories/bet.repo";
import { roundRepo } from "../repositories/round.repo";
import { userRepo } from "../repositories/user.repo";
import { ValidationError, NotFoundError } from "../lib/errors";
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
} from "../services/solana.service";

const app = new Hono<AuthContext>();
app.use("/*", authMiddleware);

// POST /api/solana/claim-tx — build unsigned claim transaction
const claimTxSchema = z.object({
  tokenId: z.string().min(1),
});

app.post("/claim-tx", async (c) => {
  const body = await c.req.json();
  const parsed = claimTxSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Invalid request");

  const userId = c.get("userId");
  const user = userRepo.getById(userId);
  if (!user?.walletAddress) throw new ValidationError("No wallet address");

  const tokenRow = roundRepo.getTokenById(parsed.data.tokenId);
  if (!tokenRow) throw new NotFoundError("Token", parsed.data.tokenId);
  if (!tokenRow.onchainRoundId) throw new ValidationError("Token has no on-chain round");

  const bettor = new PublicKey(user.walletAddress);
  const roundId = new BN(tokenRow.onchainRoundId);
  const roundPda = getRoundPda(roundId);
  const vaultPda = getVaultPda(roundPda);
  const betPositionPda = getBetPositionPda(roundPda, bettor);

  const tx = await program.methods
    .claim(roundId)
    .accounts({
      user: bettor,
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

  const serialized = tx
    .serialize({ requireAllSignatures: false })
    .toString("base64");

  return c.json({ unsignedTx: serialized });
});

// POST /api/solana/confirm-claim — record claim tx signature
const confirmClaimSchema = z.object({
  betId: z.string().min(1),
  txSignature: z.string().min(1),
});

app.post("/confirm-claim", async (c) => {
  const body = await c.req.json();
  const parsed = confirmClaimSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError("Invalid request");

  const bet = betRepo.getById(parsed.data.betId);
  if (!bet) throw new NotFoundError("Bet", parsed.data.betId);

  betRepo.updateClaimTx(bet.id, parsed.data.txSignature);
  return c.json({ ok: true });
});

export const solanaRoute = app;
