"use client"

import { useState, useEffect } from "react"
import { useReadContracts, useAccount } from "wagmi"
import { STAKING_REWARDS_ADDRESS } from "@/lib/contracts"
import { formatToken, formatRewardRate } from "@/lib/format"
import { StakeTab }    from "./StakeTab"
import { UnstakeTab }  from "./UnstakeTab"
import { ClaimButton } from "./ClaimButton"
import { FaucetButton } from "./FaucetButton"
import stakingRewardsAbi from "@/lib/abi/StakingRewards.json"

const TABS = ["Stake", "Unstake"] as const
type Tab = (typeof TABS)[number]

export function StakeCard() {
  const [tab, setTab]         = useState<Tab>("Stake")
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const { data: proto } = useReadContracts({
    contracts: [
      { address: STAKING_REWARDS_ADDRESS, abi: stakingRewardsAbi, functionName: "totalSupply"  },
      { address: STAKING_REWARDS_ADDRESS, abi: stakingRewardsAbi, functionName: "rewardRate"   },
      { address: STAKING_REWARDS_ADDRESS, abi: stakingRewardsAbi, functionName: "periodFinish" },
    ],
    query: { refetchInterval: 15_000 },
  })

  const totalSupply  = proto?.[0]?.result as bigint | undefined
  const rewardRate   = proto?.[1]?.result as bigint | undefined
  const periodFinish = proto?.[2]?.result as bigint | undefined

  const rewardRateFormatted = rewardRate !== undefined
    ? formatRewardRate(rewardRate) : "—"

  const rewardActive = periodFinish !== undefined
    && periodFinish > BigInt(Math.floor(Date.now() / 1000))

  return (
    <div className="card-accent rounded-xl overflow-hidden fade-up" style={{ backgroundColor: "var(--bg-card)" }}>

      {/* ── APR Hero ── */}
      <div
        className="relative overflow-hidden px-6 pt-6 pb-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Background glow */}
        <div aria-hidden style={{
          position: "absolute", top: -70, right: -70,
          width: 220, height: 220, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.16) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div className="relative">
          <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
            Reward Rate
          </p>
          <div className="flex items-baseline gap-3 mb-4">
            <span
              className="tabular-nums"
              style={{
                fontFamily:    "var(--font-syne), sans-serif",
                fontSize:      36,
                fontWeight:    800,
                letterSpacing: "-0.035em",
                lineHeight:    1,
                color:         mounted && rewardActive ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              {mounted ? rewardRateFormatted : "—"}
            </span>
            {mounted && rewardActive && (
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--text-secondary)" }}>
                TKB / day
              </span>
            )}
            {mounted && !rewardActive && (
              <span
                style={{
                  fontFamily:      "var(--font-ibm-plex-mono), monospace",
                  fontSize:        10,
                  letterSpacing:   "0.06em",
                  padding:         "3px 8px",
                  borderRadius:    999,
                  backgroundColor: "var(--warning-muted)",
                  color:           "var(--warning)",
                  border:          "1px solid rgba(245,158,11,0.25)",
                }}
              >
                ENDED
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", color: "var(--text-muted)" }}>
              Pool:{" "}
              <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                {mounted && totalSupply !== undefined ? `${formatToken(totalSupply)} TKA` : "—"}
              </span>
            </span>
            {rewardActive && (
              <span style={{ display: "inline-block", width: 3, height: 3, borderRadius: "50%", backgroundColor: "var(--text-dim)" }} />
            )}
            {mounted && rewardActive && (
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", color: "var(--text-muted)" }}>
                <span className="live-pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--success)", marginRight: 5 }} />
                Rewards active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }} role="tablist" aria-label="Staking actions">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            style={{
              flex:            1,
              padding:         "12px 16px",
              fontFamily:      "var(--font-syne), sans-serif",
              fontSize:        13,
              fontWeight:      tab === t ? 600 : 400,
              color:           tab === t ? "var(--text-primary)" : "var(--text-muted)",
              backgroundColor: "transparent",
              border:          "none",
              borderBottom:    tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              cursor:          "pointer",
              transition:      "all 150ms ease",
              letterSpacing:   "0.01em",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="p-5" role="tabpanel">
        <div style={{ transition: "opacity 150ms ease" }}>
          {tab === "Stake" ? <StakeTab /> : <UnstakeTab />}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-5 pb-5 pt-0 border-t flex flex-col gap-4" style={{ borderColor: "var(--border)" }}>
        <div className="pt-4">{mounted && <ClaimButton />}</div>
        <div style={{ height: 1, backgroundColor: "var(--border)" }} />
        <div>
          <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
            Need TKA to test? Faucet mints 100 TKA · 24 h cooldown
          </p>
          {mounted && <FaucetButton />}
        </div>
      </div>
    </div>
  )
}
