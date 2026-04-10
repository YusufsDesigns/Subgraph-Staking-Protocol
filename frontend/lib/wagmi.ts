import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  rainbowWallet,
  trustWallet,
  injectedWallet,
  phantomWallet,
  okxWallet,
} from "@rainbow-me/rainbowkit/wallets"
import { sepolia } from "wagmi/chains"
import { http, cookieStorage, createStorage } from "wagmi"

export const config = getDefaultConfig({
  appName: "Stakr",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [sepolia],
  transports: { [sepolia.id]: http() },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, walletConnectWallet, coinbaseWallet, rainbowWallet],
    },
    {
      groupName: "More",
      wallets: [trustWallet, phantomWallet, okxWallet, injectedWallet],
    },
  ],
})

declare module "wagmi" {
  interface Register {
    config: typeof config
  }
}
