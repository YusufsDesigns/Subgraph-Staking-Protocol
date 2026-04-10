"use client"

import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import { StakeEvent, WithdrawEvent } from "@/lib/subgraph"
import { formatUnits } from "viem"
import { Activity } from "lucide-react"

interface Props {
  stakeds:    StakeEvent[]
  withdrawns: WithdrawEvent[]
}

interface ChartPoint { time: string; staked: number; withdrawn: number }

function buildData(stakeds: StakeEvent[], withdrawns: WithdrawEvent[]): ChartPoint[] {
  const events = [
    ...stakeds.map(e => ({ ts: Number(e.blockTimestamp), type: "stake" as const,    amount: parseFloat(formatUnits(BigInt(e.amount), 18)) })),
    ...withdrawns.map(e => ({ ts: Number(e.blockTimestamp), type: "withdraw" as const, amount: parseFloat(formatUnits(BigInt(e.amount), 18)) })),
  ].sort((a, b) => a.ts - b.ts)

  const map = new Map<string, ChartPoint>()
  for (const ev of events) {
    const day = new Date(ev.ts * 1000).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    const pt  = map.get(day) ?? { time: day, staked: 0, withdrawn: 0 }
    if (ev.type === "stake") pt.staked += ev.amount
    else                     pt.withdrawn += ev.amount
    map.set(day, pt)
  }
  return Array.from(map.values())
}

function CustomTooltip({ active, payload, label }: {
  active?:  boolean
  payload?: { name: string; value: number; color: string }[]
  label?:   string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        backgroundColor: "var(--bg-elevated)",
        border:          "1px solid var(--border-strong)",
        borderRadius:    10,
        padding:         "10px 14px",
        fontFamily:      "var(--font-ibm-plex-mono), monospace",
        boxShadow:       "0 12px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ color: "var(--text-muted)", marginBottom: 8, fontSize: 11, letterSpacing: "0.04em" }}>{label}</p>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", backgroundColor: p.color, flexShrink: 0 }} />
          <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.name === "staked" ? "Staked" : "Withdrawn"}</span>
          <span style={{ color: "var(--text-primary)", marginLeft: "auto", paddingLeft: 20, fontSize: 12, fontWeight: 500 }}>
            {Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 2 })} TKA
          </span>
        </div>
      ))}
    </div>
  )
}

export function StakeChart({ stakeds, withdrawns }: Props) {
  const data = buildData(stakeds, withdrawns)

  if (data.length === 0) {
    return (
      <div
        className="card-accent rounded-xl flex flex-col items-center justify-center gap-3 fade-up"
        style={{ minHeight: 300, backgroundColor: "var(--bg-card)" }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-elevated)" }}>
          <Activity size={18} strokeWidth={1.5} style={{ color: "var(--text-muted)" }} />
        </div>
        <div className="text-center">
          <p style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 600, color: "var(--text-secondary)", fontSize: 14 }}>
            No activity yet
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
            Chart populates as users stake and withdraw.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-accent rounded-xl overflow-hidden fade-up-1" style={{ backgroundColor: "var(--bg-card)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
            Staking Activity
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2, fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
            Daily volume — stakes &amp; withdrawals
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <div style={{ position: "relative", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="ring-out" style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} />
            <span className="live-pulse" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "var(--success)", display: "inline-block" }} />
          </div>
          <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace", fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em" }}>LIVE</span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-4 pt-4 pb-3">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gStake" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.30} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="gWithdraw" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#00d4aa" stopOpacity={0.24} />
                <stop offset="100%" stopColor="#00d4aa" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="time"
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)" }}
              axisLine={false} tickLine={false} dy={8}
            />
            <YAxis
              tick={{ fill: "var(--text-muted)", fontSize: 11, fontFamily: "var(--font-ibm-plex-mono)" }}
              axisLine={false} tickLine={false} width={50}
              tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle" iconSize={6}
              wrapperStyle={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "var(--font-ibm-plex-mono)", paddingTop: 12 }}
              formatter={(v: string) => v === "staked" ? "Staked" : "Withdrawn"}
            />
            <Area type="monotone" dataKey="staked"    stroke="#7c3aed" strokeWidth={2} fill="url(#gStake)"    dot={false} activeDot={{ r: 4, fill: "#7c3aed",  strokeWidth: 0 }} />
            <Area type="monotone" dataKey="withdrawn" stroke="#00d4aa" strokeWidth={2} fill="url(#gWithdraw)" dot={false} activeDot={{ r: 4, fill: "#00d4aa",  strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
