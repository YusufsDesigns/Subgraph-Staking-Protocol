"use client"

import type { ElementType } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useSwitchChain } from "wagmi"
import { sepolia } from "wagmi/chains"
import { AlertTriangle, Layers, BarChart2 } from "lucide-react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"

const PAGE_META: Record<string, { label: string; Icon: ElementType; description: string }> = {
  "/stake":     { label: "Stake",     Icon: Layers,    description: "Deposit TKA · Earn TKB" },
  "/analytics": { label: "Analytics", Icon: BarChart2, description: "Protocol statistics" },
}

export function Header() {
  const { chain, isConnected } = useAccount()
  const { switchChain }        = useSwitchChain()
  const isWrongNetwork         = isConnected && chain && chain.id !== sepolia.id
  const [mounted, setMounted]  = useState(false)
  const pathname               = usePathname()

  useEffect(() => { setMounted(true) }, [])

  const meta = Object.entries(PAGE_META).find(([href]) =>
    pathname === href || pathname.startsWith(href + "/")
  )?.[1]

  return (
    <>
      <header
        className="flex items-center justify-between shrink-0 border-b p-4 md:p-4"
        style={{
          height:          "var(--header-h)",
          backgroundColor: "var(--bg-surface)",
          borderColor:     "var(--border)",
          position:        "sticky",
          top:             0,
          zIndex:          40,
        }}
      >
        {/* Left: page identity */}
        <div className="flex items-center gap-3 min-w-0">
          {meta && (
            <>
              <div
                className="hidden sm:flex w-7 h-7 rounded-lg items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--accent-muted)", border: "1px solid var(--accent-border)" }}
              >
                <meta.Icon size={13} strokeWidth={1.5} style={{ color: "var(--accent)" }} />
              </div>
              <div className="min-w-0">
                <span
                  className="block leading-none"
                  style={{
                    fontFamily:    "var(--font-syne), sans-serif",
                    fontWeight:    600,
                    fontSize:      15,
                    color:         "var(--text-primary)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {meta.label}
                </span>
                <span
                  className="hidden sm:block text-xs mt-0.5"
                  style={{ color: "var(--text-muted)", fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  {meta.description}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: connect button */}
        <div className="flex items-center gap-2 shrink-0">
          {mounted && <ConnectButton chainStatus="icon" showBalance={false} />}
        </div>
      </header>

      {/* Wrong-network banner */}
      {mounted && isWrongNetwork && (
        <div
          className="flex items-center justify-between gap-3 px-4 md:px-6 py-2.5 text-sm shrink-0"
          role="alert"
          aria-live="polite"
          style={{
            backgroundColor: "var(--error-muted)",
            borderBottom:    "1px solid rgba(239,68,68,0.18)",
            color:           "var(--error)",
          }}
        >
          <span className="flex items-center gap-2">
            <AlertTriangle size={13} strokeWidth={1.5} />
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12 }}>
              Wrong network — switch to Sepolia to use Stakr
            </span>
          </span>
          <button
            onClick={() => switchChain({ chainId: sepolia.id })}
            className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 active:scale-95"
            style={{
              backgroundColor: "rgba(239,68,68,0.18)",
              color:           "var(--error)",
              border:          "1px solid rgba(239,68,68,0.3)",
              minHeight:       30,
              fontFamily:      "var(--font-syne), sans-serif",
            }}
          >
            Switch to Sepolia
          </button>
        </div>
      )}
    </>
  )
}
