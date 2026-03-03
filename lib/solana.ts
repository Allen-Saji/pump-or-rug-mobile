import { useCallback } from "react";
import { useEmbeddedSolanaWallet } from "@privy-io/expo";
import { Connection, Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import type { SolanaSignAndSend } from "./store";

const SOLANA_RPC = "https://api.devnet.solana.com";

export function useSolanaSignAndSend(): SolanaSignAndSend | undefined {
  const solanaWallet = useEmbeddedSolanaWallet();

  const signAndSend = useCallback(
    async (unsignedTxBase64: string): Promise<string> => {
      if (solanaWallet.status !== "connected" || !solanaWallet.wallets[0]) {
        throw new Error("Solana wallet not connected");
      }

      const provider = await solanaWallet.wallets[0].getProvider();
      const txBytes = Buffer.from(unsignedTxBase64, "base64");
      const transaction = Transaction.from(txBytes);
      const connection = new Connection(SOLANA_RPC, "confirmed");

      const result = await provider.request({
        method: "signAndSendTransaction",
        params: {
          transaction,
          connection,
        },
      });

      return result.signature;
    },
    [solanaWallet.status]
  );

  return solanaWallet.status === "connected" ? signAndSend : undefined;
}
