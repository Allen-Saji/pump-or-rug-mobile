import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Platform } from "react-native";
import { useEmbeddedSolanaWallet } from "@privy-io/expo";
import {
  transact,
  Web3MobileWallet,
} from "@solana-mobile/mobile-wallet-adapter-protocol-web3js";
import { Connection, Transaction } from "@solana/web3.js";
import { Buffer } from "buffer";
import * as SecureStore from "expo-secure-store";
import type { SolanaSignAndSend } from "./store";
import { api } from "./api";

const SOLANA_RPC = "https://api.devnet.solana.com";
const MWA_AUTH_TOKEN_KEY = "mwa_auth_token";
const MWA_WALLET_NAME_KEY = "mwa_wallet_name";
const MWA_ADDRESS_KEY = "mwa_address";

const APP_IDENTITY = {
  name: "Pump or Rug",
  uri: "https://pumporrug.allensaji.dev",
  icon: "favicon.ico",
};

type WalletType = "embedded" | "external";

interface WalletContextValue {
  activeWallet: WalletType;
  activeAddress: string | null;
  externalAddress: string | null;
  externalWalletName: string | null;
  isReady: boolean;
  signAndSend: SolanaSignAndSend;
  connectExternal: () => Promise<void>;
  disconnectExternal: () => void;
  switchWallet: (type: WalletType) => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const solanaWallet = useEmbeddedSolanaWallet();

  const [activeWallet, setActiveWallet] = useState<WalletType>("embedded");
  const [externalAddress, setExternalAddress] = useState<string | null>(null);
  const [externalWalletName, setExternalWalletName] = useState<string | null>(null);
  const [mwaAuthToken, setMwaAuthToken] = useState<string | null>(null);

  const embeddedAddress =
    solanaWallet.status === "connected"
      ? solanaWallet.wallets[0]?.address ?? null
      : null;

  const activeAddress =
    activeWallet === "external" && externalAddress
      ? externalAddress
      : embeddedAddress;

  const isReady =
    activeWallet === "external"
      ? !!externalAddress
      : solanaWallet.status === "connected";

  // Restore persisted MWA session on mount
  useEffect(() => {
    (async () => {
      const [token, name, addr] = await Promise.all([
        SecureStore.getItemAsync(MWA_AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(MWA_WALLET_NAME_KEY),
        SecureStore.getItemAsync(MWA_ADDRESS_KEY),
      ]);
      if (token && addr) {
        setMwaAuthToken(token);
        setExternalAddress(addr);
        setExternalWalletName(name);
      }
    })();
  }, []);

  // Sync active address to server when it changes
  const lastSyncedAddr = useRef<string | null>(null);
  useEffect(() => {
    if (activeAddress && activeAddress !== lastSyncedAddr.current) {
      lastSyncedAddr.current = activeAddress;
      api.updateWallet(activeAddress).catch((err) => {
        console.log("[wallet] Address sync:", err?.message || "ok");
      });
    }
  }, [activeAddress]);

  const connectExternal = useCallback(async () => {
    if (Platform.OS !== "android") {
      throw new Error("External wallets are only supported on Android");
    }

    await transact(async (wallet: Web3MobileWallet) => {
      const result = await wallet.authorize({
        identity: APP_IDENTITY,
        cluster: "devnet",
      });

      const address = result.accounts[0]?.address;
      if (!address) throw new Error("No account returned from wallet");

      const walletName = result.wallet_uri_base
        ? new URL(result.wallet_uri_base).hostname.replace("www.", "")
        : "External Wallet";

      setExternalAddress(address);
      setExternalWalletName(walletName);
      setMwaAuthToken(result.auth_token);
      setActiveWallet("external");

      // Persist for reauthorize
      await Promise.all([
        SecureStore.setItemAsync(MWA_AUTH_TOKEN_KEY, result.auth_token),
        SecureStore.setItemAsync(MWA_WALLET_NAME_KEY, walletName),
        SecureStore.setItemAsync(MWA_ADDRESS_KEY, address),
      ]);
    });
  }, []);

  const disconnectExternal = useCallback(() => {
    setExternalAddress(null);
    setExternalWalletName(null);
    setMwaAuthToken(null);
    setActiveWallet("embedded");

    SecureStore.deleteItemAsync(MWA_AUTH_TOKEN_KEY);
    SecureStore.deleteItemAsync(MWA_WALLET_NAME_KEY);
    SecureStore.deleteItemAsync(MWA_ADDRESS_KEY);
  }, []);

  const switchWallet = useCallback(
    (type: WalletType) => {
      if (type === "external" && !externalAddress) return;
      setActiveWallet(type);
    },
    [externalAddress]
  );

  // --- Sign and send ---

  const signWithEmbedded = useCallback(
    async (unsignedTxBase64: string): Promise<string> => {
      if (solanaWallet.status !== "connected" || !solanaWallet.wallets[0]) {
        throw new Error("Embedded wallet not connected");
      }
      const provider = await solanaWallet.wallets[0].getProvider();
      const txBytes = Buffer.from(unsignedTxBase64, "base64");
      const transaction = Transaction.from(txBytes);
      const connection = new Connection(SOLANA_RPC, "confirmed");

      const result = await provider.request({
        method: "signAndSendTransaction",
        params: { transaction, connection },
      });
      return result.signature;
    },
    [solanaWallet.status]
  );

  const signWithExternal = useCallback(
    async (unsignedTxBase64: string): Promise<string> => {
      if (!mwaAuthToken) throw new Error("External wallet not authorized");

      const txBytes = Buffer.from(unsignedTxBase64, "base64");
      const transaction = Transaction.from(txBytes);

      const signatures = await transact(async (wallet: Web3MobileWallet) => {
        // Reauthorize with stored token
        await wallet.reauthorize({
          auth_token: mwaAuthToken,
          identity: APP_IDENTITY,
        });

        return wallet.signAndSendTransactions({
          transactions: [transaction],
        });
      });

      if (!signatures || signatures.length === 0) {
        throw new Error("No signature returned from external wallet");
      }

      // MWA returns Uint8Array[] signatures — encode to base58
      const bs58 = require("bs58");
      return bs58.default.encode(signatures[0]);
    },
    [mwaAuthToken]
  );

  const signAndSend: SolanaSignAndSend = useCallback(
    async (unsignedTxBase64: string) => {
      if (activeWallet === "external") {
        return signWithExternal(unsignedTxBase64);
      }
      return signWithEmbedded(unsignedTxBase64);
    },
    [activeWallet, signWithExternal, signWithEmbedded]
  );

  return (
    <WalletContext.Provider
      value={{
        activeWallet,
        activeAddress,
        externalAddress,
        externalWalletName,
        isReady,
        signAndSend,
        connectExternal,
        disconnectExternal,
        switchWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
