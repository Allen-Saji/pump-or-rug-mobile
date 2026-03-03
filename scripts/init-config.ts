/**
 * One-time script: initialize the GlobalConfig PDA on devnet.
 * Run: cd server && bun ../scripts/init-config.ts
 */
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { readFileSync } from "fs";
import IDL from "../server/src/lib/idl.json";
import type { PumpOrRugEscrow } from "../server/src/lib/idl-types";

const RPC_URL = "https://api.devnet.solana.com";
const KEYPAIR_PATH =
  process.env.RESOLVER_KEYPAIR_PATH ||
  `${process.env.HOME}/.config/solana/id.json`;
const FEE_BPS = 500; // 5%

async function main() {
  // Load admin keypair
  const raw = JSON.parse(readFileSync(KEYPAIR_PATH, "utf-8"));
  const adminKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  console.log("Admin:", adminKeypair.publicKey.toBase58());

  // Setup connection + program
  const connection = new Connection(RPC_URL, "confirmed");
  const wallet = new Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const program = new Program<PumpOrRugEscrow>(
    IDL as PumpOrRugEscrow,
    provider
  );

  // Derive GlobalConfig PDA
  const [globalConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("global-config")],
    program.programId
  );
  console.log("GlobalConfig PDA:", globalConfigPda.toBase58());

  // Check if already initialized
  try {
    const existing = await program.account.globalConfig.fetch(globalConfigPda);
    console.log("GlobalConfig already initialized!");
    console.log("  Admin:", existing.admin.toBase58());
    console.log("  Resolver:", existing.resolver.toBase58());
    console.log("  Treasury:", existing.treasury.toBase58());
    console.log("  Fee BPS:", existing.feeBps);
    console.log("  Paused:", existing.paused);
    return;
  } catch {
    // Not initialized yet — proceed
  }

  console.log(`Initializing config with fee_bps=${FEE_BPS}...`);
  console.log("Treasury (same as admin):", adminKeypair.publicKey.toBase58());
  const tx = await program.methods
    .initializeConfig(FEE_BPS)
    .accounts({
      admin: adminKeypair.publicKey,
      treasury: adminKeypair.publicKey,
    })
    .signers([adminKeypair])
    .rpc();

  console.log("Tx:", tx);
  console.log("GlobalConfig initialized successfully!");

  // Verify
  const config = await program.account.globalConfig.fetch(globalConfigPda);
  console.log("  Admin:", config.admin.toBase58());
  console.log("  Resolver:", config.resolver.toBase58());
  console.log("  Treasury:", config.treasury.toBase58());
  console.log("  Fee BPS:", config.feeBps);
}

main().catch(console.error);
