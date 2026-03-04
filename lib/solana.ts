import { useWallet } from "./wallet";
import type { SolanaSignAndSend } from "./store";

export function useSolanaSignAndSend(): SolanaSignAndSend | undefined {
  const { signAndSend, isReady } = useWallet();
  return isReady ? signAndSend : undefined;
}
