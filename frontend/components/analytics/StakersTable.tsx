"use client"

import { StakerData } from "@/lib/subgraph"
import { formatToken, shortenAddress } from "@/lib/format"
import { ExternalLink, Trophy } from "lucide-react"

interface Props { stakers: StakerData[] }

const MEDALS = [
  { bg: "#FFD700", fg: "#5c3d00", shadow: "rgba(255,215,0,0.4)"    },
  { bg: "#C0C0C0", fg: "#2e2e2e", shadow: "rgba(192,192,192,0.35)" },
  { bg: "#CD7F32", fg: "#3d1c00", shadow: "rgba(205,127,50,0.35)"  },
]

export function StakersTable({ stakers }: Props) {
  if (stakers.length === 0) {
    return (
      <div
        className="card-accent rounded-xl h-full flex flex-col items-center justify-center gap-3 p-8 text-center fade-up-2"
        style={{ backgroundColor: "var(--bg-card)", minHeight: 300 }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-elevated)" }}>
          <Trophy size={18} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
        </div>
        <p style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 600, color: "var(--text-secondary)", fontSize: 14 }}>No stakers yet</p>
        <p style={{ color: "var(--text-muted)", fontSize: 12 }}>Be the first to stake TKA.</p>
      </div>
    )
  }

  const totalStaked = stakers.reduce((s, x) => s + BigInt(x.stakedBalance), 0n)

  return (
    <div
      className="card-accent rounded-xl overflow-hidden flex flex-col fade-up-2"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Leaderboard
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2, fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
            Ranked by staked amount
          </p>
        </div>
        <span
          style={{
            backgroundColor: "var(--accent-muted)",
            color:           "var(--accent)",
            fontFamily:      "var(--font-ibm-plex-mono), monospace",
            fontSize:        11,
            padding:         "3px 10px",
            borderRadius:    999,
            border:          "1px solid var(--accent-border)",
          }}
        >
          {stakers.length}
        </span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {stakers.map((s, i) => {
          const medal    = MEDALS[i] as typeof MEDALS[number] | undefined
          const share    = totalStaked > 0n
            ? ((Number(BigInt(s.stakedBalance)) / Number(totalStaked)) * 100).toFixed(1)
            : "0.0"
          const isLeader = i === 0

          return (
            <div
              key={s.id}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150"
              style={{
                borderBottom:    i < stakers.length - 1 ? `1px solid var(--border-subtle)` : "none",
                backgroundColor: isLeader ? "rgba(124,58,237,0.04)" : "transparent",
              }}
              onMouseEnter={e => { if (!isLeader) (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--bg-elevated)" }}
              onMouseLeave={e => { if (!isLeader) (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent" }}
            >
              {/* Rank badge */}
              <span
                className="inline-flex items-center justify-center shrink-0"
                style={{
                  width:           26,
                  height:          26,
                  borderRadius:    "50%",
                  backgroundColor: medal ? medal.bg : "var(--bg-elevated)",
                  color:           medal ? medal.fg : "var(--text-muted)",
                  boxShadow:       medal ? `0 0 0 2px ${medal.shadow}` : "none",
                  fontFamily:      "var(--font-ibm-plex-mono), monospace",
                  fontSize:        11,
                  fontWeight:      medal ? 700 : 400,
                }}
              >
                {i + 1}
              </span>

              {/* Address + share bar */}
              <div className="flex-1 min-w-0">
                <a
                  href={`https://sepolia.etherscan.io/address/${s.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 group"
                  style={{
                    fontFamily: "var(--font-ibm-plex-mono), monospace",
                    fontSize:   12,
                    color:      "var(--text-secondary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--accent)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)")}
                >
                  {shortenAddress(s.id)}
                  <ExternalLink size={9} strokeWidth={1.5} style={{ opacity: 0.4 }} />
                </a>
                {/* Pool share mini bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: "var(--bg-elevated)", overflow: "hidden" }}>
                    <div style={{
                      width:           `${Math.min(parseFloat(share), 100)}%`,
                      height:          "100%",
                      borderRadius:    2,
                      backgroundColor: isLeader ? "var(--accent)" : "var(--text-muted)",
                      transition:      "width 600ms ease",
                    }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: isLeader ? "var(--accent)" : "var(--text-muted)", flexShrink: 0 }}>
                    {share}%
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <p className="tabular-nums" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>
                  {formatToken(BigInt(s.stakedBalance))}
                </p>
                <p style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--success)", marginTop: 1 }}>
                  +{formatToken(BigInt(s.totalRewardsClaimed))}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer legend */}
      <div className="px-5 py-2.5 border-t flex items-center justify-between shrink-0" style={{ borderColor: "var(--border)" }}>
        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--text-dim)" }}>TKA staked</span>
        <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--success)", opacity: 0.6 }}>+TKB claimed</span>
      </div>
    </div>
  )
}
