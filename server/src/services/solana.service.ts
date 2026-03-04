import { AnchorProvider, BN, Program, Wallet } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { readFileSync } from "fs";
import { config } from "../lib/config";
import IDL from "../lib/idl.json";
import type { PumpOrRugEscrow } from "../lib/idl-types";

// ── Keypair loading ──────────────────────────────────────────────
function loadKeypair(): Keypair {
  // Prefer base64-encoded keypair from env (for deployed environments)
  const b64 = process.env.RESOLVER_KEYPAIR_BASE64;
  if (b64) {
    const raw = JSON.parse(Buffer.from(b64, "base64").toString("utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  // Fallback to file path for local dev
  const path = config.resolverKeypairPath;
  const resolved = path.replace(/^~/, process.env.HOME || "");
  const raw = JSON.parse(readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

// ── Singleton instances ──────────────────────────────────────────
const connection = new Connection(config.solanaRpcUrl, "confirmed");
const adminKeypair = loadKeypair();
const wallet = new Wallet(adminKeypair);
const provider = new AnchorProvider(connection, wallet, {
  commitment: "confirmed",
});

const program = new Program<PumpOrRugEscrow>(
  IDL as PumpOrRugEscrow,
  provider
);

// ── PDA helpers ──────────────────────────────────────────────────
const PROGRAM_ID = new PublicKey(config.programId);

export function getGlobalConfigPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global-config")],
    PROGRAM_ID
  );
  return pda;
}

export function getRoundPda(roundId: BN): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("round"), roundId.toArrayLike(Buffer, "le", 8)],
    PROGRAM_ID
  );
  return pda;
}

export function getVaultPda(roundPda: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), roundPda.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export function getBetPositionPda(
  roundPda: PublicKey,
  bettor: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bet"), roundPda.toBuffer(), bettor.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

// ── Round ID mapping ─────────────────────────────────────────────
// Each game round has 4 tokens; each token gets its own on-chain round
export function toOnchainRoundId(
  roundNumber: number,
  tokenIndex: number
): BN {
  return new BN(roundNumber * 4 + tokenIndex);
}

// ── Exports ──────────────────────────────────────────────────────
export {
  connection,
  adminKeypair,
  program,
  provider,
  PROGRAM_ID,
  BN,
  SystemProgram,
  PublicKey,
};
