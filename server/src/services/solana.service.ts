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
function loadKeypair(path: string): Keypair {
  const resolved = path.replace(/^~/, process.env.HOME || "");
  const raw = JSON.parse(readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

// ── Singleton instances ──────────────────────────────────────────
const connection = new Connection(config.solanaRpcUrl, "confirmed");
const adminKeypair = loadKeypair(config.resolverKeypairPath);
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
