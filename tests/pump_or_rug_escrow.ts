import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js";
import { expect } from "chai";

const { SystemProgram, PublicKey, Keypair, LAMPORTS_PER_SOL } = anchor.web3;

describe("pump_or_rug_escrow e2e", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PumpOrRugEscrow as anchor.Program<any>;

  const admin = (provider.wallet as any).payer as Keypair;
  const treasury = Keypair.generate();
  const bettorA = Keypair.generate();
  const bettorB = Keypair.generate();

  const roundId = new BN(Date.now());

  let globalConfigPda: PublicKey;
  let roundPda: PublicKey;
  let vaultPda: PublicKey;
  let betAPda: PublicKey;
  let betBPda: PublicKey;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  before(async () => {
    [globalConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global-config")],
      program.programId
    );

    [roundPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round"), roundId.toArrayLike(Buffer, "le", 8)],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), roundPda.toBuffer()],
      program.programId
    );

    [betAPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), roundPda.toBuffer(), bettorA.publicKey.toBuffer()],
      program.programId
    );

    [betBPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), roundPda.toBuffer(), bettorB.publicKey.toBuffer()],
      program.programId
    );

    // fund test users + treasury rent
    for (const kp of [bettorA, bettorB, treasury]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, 3 * LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig, "confirmed");
    }
  });

  it("initializes config", async () => {
    await program.methods
      .initializeConfig(500) // 5%
      .accounts({
        admin: admin.publicKey,
        treasury: treasury.publicKey,
        globalConfig: globalConfigPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const cfg = await program.account.globalConfig.fetch(globalConfigPda);
    expect(cfg.admin.toBase58()).eq(admin.publicKey.toBase58());
    expect(cfg.treasury.toBase58()).eq(treasury.publicKey.toBase58());
    expect(cfg.feeBps).eq(500);
    expect(cfg.paused).eq(false);
  });

  it("creates round, places bets, resolves, claims, sweeps, closes", async () => {
    const now = Math.floor(Date.now() / 1000);
    const openTs = new BN(now - 5);
    const closeTs = new BN(now + 10);
    const settleTs = new BN(now + 14);

    await program.methods
      .createRound(roundId, openTs, closeTs, settleTs)
      .accounts({
        admin: admin.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    // C2 verify: fee_bps is snapshotted on the round
    let round = await program.account.round.fetch(roundPda);
    expect(round.feeBps).eq(500);

    // 1 SOL pump (bettorA), 1 SOL rug (bettorB)
    await program.methods
      .placeBet(roundId, { pump: {} }, new BN(1 * LAMPORTS_PER_SOL))
      .accounts({
        bettor: bettorA.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
        vault: vaultPda,
        betPosition: betAPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorA])
      .rpc();

    await program.methods
      .placeBet(roundId, { rug: {} }, new BN(1 * LAMPORTS_PER_SOL))
      .accounts({
        bettor: bettorB.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
        vault: vaultPda,
        betPosition: betBPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorB])
      .rpc();

    round = await program.account.round.fetch(roundPda);
    expect(round.totalPoolLamports.toNumber()).eq(2 * LAMPORTS_PER_SOL);
    expect(round.totalPumpLamports.toNumber()).eq(1 * LAMPORTS_PER_SOL);
    expect(round.totalRugLamports.toNumber()).eq(1 * LAMPORTS_PER_SOL);

    // wait until settle
    await sleep(16_000);

    await program.methods
      .resolveRound(roundId, { pump: {} })
      .accounts({
        resolver: admin.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
      })
      .signers([admin])
      .rpc();

    // winner claim (bettorA)
    await program.methods
      .claim(roundId)
      .accounts({
        user: bettorA.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
        vault: vaultPda,
        betPosition: betAPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorA])
      .rpc();

    // loser claim (bettorB) - marks claimed, payout 0
    await program.methods
      .claim(roundId)
      .accounts({
        user: bettorB.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
        vault: vaultPda,
        betPosition: betBPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorB])
      .rpc();

    // H1 verify: bet_position accounts are closed after claim (rent reclaimed)
    const betAAfterClaim = await program.account.betPosition.fetchNullable(betAPda);
    expect(betAAfterClaim).to.be.null;
    const betBAfterClaim = await program.account.betPosition.fetchNullable(betBPda);
    expect(betBAfterClaim).to.be.null;

    round = await program.account.round.fetch(roundPda);
    expect(round.feesCollectedLamports.toNumber()).eq(50_000_000); // 5% of 1 SOL loser side profit
    expect(round.claimedPositions).eq(round.totalPositions);

    // sweep fees
    await program.methods
      .sweepFees(roundId)
      .accounts({
        admin: admin.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
        vault: vaultPda,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    round = await program.account.round.fetch(roundPda);
    expect(round.feesCollectedLamports.toNumber()).eq(0);

    // H2 verify: close_round closes the Round account (rent reclaimed)
    await program.methods
      .closeRound(roundId)
      .accounts({
        admin: admin.publicKey,
        globalConfig: globalConfigPda,
        round: roundPda,
        vault: vaultPda,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const closedRound = await program.account.round.fetchNullable(roundPda);
    expect(closedRound).to.be.null;
  });

  it("can cancel and force-close, users still claim after force-close", async () => {
    const round2 = new BN(Date.now() + 7777);
    const [round2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("round"), round2.toArrayLike(Buffer, "le", 8)],
      program.programId
    );
    const [vault2Pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), round2Pda.toBuffer()],
      program.programId
    );
    const [bet2APda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bet"), round2Pda.toBuffer(), bettorA.publicKey.toBuffer()],
      program.programId
    );

    const now = Math.floor(Date.now() / 1000);
    const openTs = new BN(now - 5);
    const closeTs = new BN(now + 1);
    const settleTs = new BN(now + 2);

    await program.methods
      .createRound(round2, openTs, closeTs, settleTs)
      .accounts({
        admin: admin.publicKey,
        globalConfig: globalConfigPda,
        round: round2Pda,
        vault: vault2Pda,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    await program.methods
      .placeBet(round2, { pump: {} }, new BN(0.5 * LAMPORTS_PER_SOL))
      .accounts({
        bettor: bettorA.publicKey,
        globalConfig: globalConfigPda,
        round: round2Pda,
        vault: vault2Pda,
        betPosition: bet2APda,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorA])
      .rpc();

    // emergency cancel to VOID
    await program.methods
      .cancelRound(round2)
      .accounts({
        resolver: admin.publicKey,
        globalConfig: globalConfigPda,
        round: round2Pda,
      })
      .signers([admin])
      .rpc();

    // wait until settle timestamp passes
    await sleep(2500);

    // C1 fix: force close only sweeps fees (none here), users can still claim
    await program.methods
      .forceCloseRound(round2, new BN(0))
      .accounts({
        admin: admin.publicKey,
        globalConfig: globalConfigPda,
        round: round2Pda,
        vault: vault2Pda,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    let round2Acc = await program.account.round.fetch(round2Pda);
    expect(round2Acc.status).to.have.property("closed");

    // C1 verify: user can STILL claim after force_close (Void = full refund)
    const balBefore = await provider.connection.getBalance(bettorA.publicKey);

    await program.methods
      .claim(round2)
      .accounts({
        user: bettorA.publicKey,
        globalConfig: globalConfigPda,
        round: round2Pda,
        vault: vault2Pda,
        betPosition: bet2APda,
        systemProgram: SystemProgram.programId,
      })
      .signers([bettorA])
      .rpc();

    const balAfter = await provider.connection.getBalance(bettorA.publicKey);
    // User gets back ~0.5 SOL bet + bet_position rent, minus tx fee
    expect(balAfter).to.be.greaterThan(balBefore + 0.49 * LAMPORTS_PER_SOL);

    // Now admin can close_round (all claimed) to reclaim Round rent
    await program.methods
      .closeRound(round2)
      .accounts({
        admin: admin.publicKey,
        globalConfig: globalConfigPda,
        round: round2Pda,
        vault: vault2Pda,
        treasury: treasury.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const closedRound2 = await program.account.round.fetchNullable(round2Pda);
    expect(closedRound2).to.be.null;
  });

  it("L1: admin can transfer admin role", async () => {
    const newAdmin = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(newAdmin.publicKey, 1 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");

    // Transfer admin to newAdmin
    await program.methods
      .setAdmin(newAdmin.publicKey)
      .accounts({
        admin: admin.publicKey,
        globalConfig: globalConfigPda,
      })
      .signers([admin])
      .rpc();

    let cfg = await program.account.globalConfig.fetch(globalConfigPda);
    expect(cfg.admin.toBase58()).eq(newAdmin.publicKey.toBase58());

    // Transfer back so other tests still work if needed
    await program.methods
      .setAdmin(admin.publicKey)
      .accounts({
        admin: newAdmin.publicKey,
        globalConfig: globalConfigPda,
      })
      .signers([newAdmin])
      .rpc();

    cfg = await program.account.globalConfig.fetch(globalConfigPda);
    expect(cfg.admin.toBase58()).eq(admin.publicKey.toBase58());
  });
});
