import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { useEmbeddedSolanaWallet } from "@privy-io/expo";
import { Connection, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Buffer } from "buffer";
import type { SolanaSignAndSend } from "./store";

const SOLANA_RPC = "https://api.devnet.solana.com";
const connection = new Connection(SOLANA_RPC, "confirmed");

interface WalletContextValue {
  activeAddress: string | null;
  isReady: boolean;
  signAndSend: SolanaSignAndSend;
  solBalance: number | null;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const solanaWallet = useEmbeddedSolanaWallet();
  const [solBalance, setSolBalance] = useState<number | null>(null);

  const activeAddress =
    solanaWallet.status === "connected"
      ? solanaWallet.wallets[0]?.address ?? null
      : null;

  const isReady = solanaWallet.status === "connected";

  const refreshBalance = useCallback(async () => {
    if (!activeAddress) {
      setSolBalance(null);
      return;
    }
    try {
      const balance = await connection.getBalance(new PublicKey(activeAddress));
      setSolBalance(balance / LAMPORTS_PER_SOL);
    } catch {
      setSolBalance(null);
    }
  }, [activeAddress]);

  // Auto-fetch balance when address becomes available
  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const signAndSend: SolanaSignAndSend = useCallback(
    async (unsignedTxBase64: string): Promise<string> => {
      if (solanaWallet.status !== "connected" || !solanaWallet.wallets[0]) {
        throw new Error("Embedded wallet not connected");
      }
      const provider = await solanaWallet.wallets[0].getProvider();
      const txBytes = Buffer.from(unsignedTxBase64, "base64");
      const transaction = Transaction.from(txBytes);

      const result = await provider.request({
        method: "signAndSendTransaction",
        params: { transaction, connection },
      });

      // Refresh balance after successful tx
      setTimeout(refreshBalance, 2000);

      return result.signature;
    },
    [solanaWallet.status, refreshBalance]
  );

  return (
    <WalletContext.Provider
      value={{
        activeAddress,
        isReady,
        signAndSend,
        solBalance,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
