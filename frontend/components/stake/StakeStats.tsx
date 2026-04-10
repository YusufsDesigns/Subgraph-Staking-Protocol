"use client"

import type { ReactNode, ElementType } from "react"
import { useState, useEffect } from "react"
import { useReadContracts, useReadContract, useAccount } from "wagmi"
import { STAKING_REWARDS_ADDRESS } from "@/lib/contracts"
import { formatToken, formatRewardRate } from "@/lib/format"
import stakingRewardsAbi from "@/lib/abi/StakingRewards.json"
import { TrendingUp, Clock, Users, Gift, ExternalLink } from "lucide-react"

export function StakeStats() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  useEffect(() => { setMounted(true) }, [])

  const { data: proto } = useReadContracts({
    contracts: [
      { address: STAKING_REWARDS_ADDRESS, abi: stakingRewardsAbi, functionName: "totalSupply"  },
      { address: STAKING_REWARDS_ADDRESS, abi: stakingRewardsAbi, functionName: "rewardRate"   },
      { address: STAKING_REWARDS_ADDRESS, abi: stakingRewardsAbi, functionName: "periodFinish" },
    ],
    query: { refetchInterval: 15_000 },
  })

  const { data: earned } = useReadContract({
    address:      STAKING_REWARDS_ADDRESS,
    abi:          stakingRewardsAbi,
    functionName: "earned",
    args:         [address!],
    query:        { enabled: !!address, refetchInterval: 10_000 },
  })

  const { data: staked } = useReadContract({
    address:      STAKING_REWARDS_ADDRESS,
    abi:          stakingRewardsAbi,
    functionName: "balanceOf",
    args:         [address!],
    query:        { enabled: !!address, refetchInterval: 10_000 },
  })

  const totalSupply  = proto?.[0]?.result as bigint | undefined
  const rewardRate   = proto?.[1]?.result as bigint | undefined
  const periodFinish = proto?.[2]?.result as bigint | undefined
  const earnedBig    = earned as bigint | undefined
  const stakedBig    = staked as bigint | undefined

  const rewardRateFormatted = rewardRate !== undefined
    ? formatRewardRate(rewardRate) : "—"

  const rewardActive = periodFinish !== undefined
    && periodFinish > BigInt(Math.floor(Date.now() / 1000))

  // Countdown to period end
  const secondsLeft = periodFinish
    ? Math.max(0, Number(periodFinish) - Math.floor(Date.now() / 1000))
    : null
  const daysLeft  = secondsLeft !== null ? Math.floor(secondsLeft / 86400) : null
  const hoursLeft = secondsLeft !== null ? Math.floor((secondsLeft % 86400) / 3600) : null

  const stat = (
    label: string,
    value: ReactNode,
    sub: string,
    icon: ElementType,
    accent: string
  ) => {
    const Icon = icon
    return (
      <div
        className="flex items-start gap-3 p-4 rounded-xl"
        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${accent}18` }}
        >
          <Icon size={14} strokeWidth={1.5} style={{ color: accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 4 }}>
            {label}
          </p>
          <div className="tabular-nums" style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {value}
          </div>
          <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{sub}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 fade-up-1">

      {/* Protocol overview heading */}
      <div>
        <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          Protocol Overview
        </h2>
        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
          Live contract data · updates every 15s
        </p>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3">
        {stat(
          "Reward Rate",
          mounted ? (
            <span style={{ color: rewardActive ? "#7c3aed" : "var(--text-muted)" }}>
              {rewardRateFormatted}
              <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4, color: "var(--text-secondary)" }}>TKB/day</span>
            </span>
          ) : "—",
          rewardActive ? "rewards active" : "rewards ended",
          TrendingUp, "#7c3aed"
        )}

        {stat(
          "Pool Size",
          mounted && totalSupply !== undefined
            ? `${formatToken(totalSupply)} TKA`
            : "—",
          "total staked",
          Users, "#6366f1"
        )}

        {stat(
          "Period End",
          mounted && daysLeft !== null
            ? (daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h` : ((secondsLeft ?? 0) > 0 ? `${hoursLeft}h` : "Ended"))
            : "—",
          "reward period remaining",
          Clock, "#f59e0b"
        )}

        {stat(
          "Your Earnings",
          mounted && isConnected && earnedBig !== undefined
            ? <span style={{ color: "#00d4aa" }}>{formatToken(earnedBig)} TKB</span>
            : <span style={{ color: "var(--text-muted)", fontSize: 14 }}>—</span>,
          isConnected ? "claimable rewards" : "connect wallet",
          Gift, "#00d4aa"
        )}
      </div>

      {/* Your position (if staked) */}
      {mounted && isConnected && stakedBig !== undefined && stakedBig > 0n && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--accent)", letterSpacing: "0.04em" }}>
              YOUR POSITION
            </span>
            <span
              className="tabular-nums"
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 14, fontWeight: 500, color: "var(--accent)" }}
            >
              {formatToken(stakedBig)} TKA
            </span>
          </div>
          {totalSupply !== undefined && totalSupply > 0n && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--text-muted)" }}>Pool share</span>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--accent)" }}>
                  {((Number(stakedBig) / Number(totalSupply)) * 100).toFixed(2)}%
                </span>
              </div>
              <div style={{ height: 4, borderRadius: 2, backgroundColor: "rgba(124,58,237,0.2)", overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min((Number(stakedBig) / Number(totalSupply)) * 100, 100)}%`,
                  height: "100%", borderRadius: 2, backgroundColor: "var(--accent)", transition: "width 600ms ease"
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contract links */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
          Contract links
        </p>
        {[
          { label: "StakingRewards", addr: "0xd2102D8e2607908b369bB72B2BbDA6d421fFbF01" },
          { label: "Token TKA",      addr: "0xFF7FcC43310c04A0fbc8849fFA6bed251C1B7872" },
          { label: "Token TKB",      addr: "0x11e249887f46262805Fc7bc3cf08035B4C7204E2" },
        ].map(({ label, addr }) => (
          <a
            key={addr}
            href={`https://sepolia.etherscan.io/address/${addr}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between py-2 group"
            style={{ borderBottom: "1px solid var(--border-subtle)", textDecoration: "none" }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.75")}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")}
          >
            <span style={{ fontFamily: "var(--font-syne), sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>{label}</span>
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 11, color: "var(--text-muted)" }}>
                {addr.slice(0, 6)}…{addr.slice(-4)}
              </span>
              <ExternalLink size={10} strokeWidth={1.5} style={{ color: "var(--text-dim)" }} />
            </div>
          </a>
        ))}
      </div>

    </div>
  )
}
