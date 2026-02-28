import { useEffect, useRef } from "react";
import { usePrivy, useLoginWithOAuth, useEmbeddedSolanaWallet } from "@privy-io/expo";
import type { OAuthProviderID } from "@privy-io/expo";

export type AuthProvider = "google" | "twitter" | "apple";

export function useAuth() {
  const { user, isReady, logout } = usePrivy();
  const { login, state: oauthState } = useLoginWithOAuth();
  const solanaWallet = useEmbeddedSolanaWallet();
  const creatingWallet = useRef(false);

  const authenticated = !!user;

  // Auto-create Solana wallet after login if not yet created
  useEffect(() => {
    if (
      authenticated &&
      solanaWallet.status === "not-created" &&
      solanaWallet.create &&
      !creatingWallet.current
    ) {
      creatingWallet.current = true;
      solanaWallet.create().finally(() => {
        creatingWallet.current = false;
      });
    }
  }, [authenticated, solanaWallet.status]);

  const walletAddress =
    solanaWallet.status === "connected"
      ? solanaWallet.wallets[0]?.address ?? null
      : null;

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
    : null;

  const loginWithProvider = async (provider: AuthProvider) => {
    const providerMap: Record<AuthProvider, OAuthProviderID> = {
      google: "google",
      twitter: "twitter",
      apple: "apple",
    };
    await login({ provider: providerMap[provider] });
  };

  return {
    user,
    authenticated,
    isReady,
    walletAddress,
    truncatedAddress,
    walletStatus: solanaWallet.status,
    login: loginWithProvider,
    logout,
    oauthLoading: oauthState.status === "loading",
  };
}
