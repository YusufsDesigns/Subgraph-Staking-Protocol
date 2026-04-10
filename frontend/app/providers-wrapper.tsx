"use client"

import dynamic from "next/dynamic"

// wagmi / WalletConnect access browser APIs (localStorage, window.location) during
// module initialisation — not safe to evaluate server-side. Loading client-only
// prevents SSR of this module tree without touching the layout server component.
const Providers = dynamic(
  () => import("./providers").then((m) => ({ default: m.Providers })),
  { ssr: false, loading: () => null }
)

export function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
