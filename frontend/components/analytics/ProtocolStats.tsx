import type { ElementType } from "react"
import { ProtocolData } from "@/lib/subgraph"
import { formatToken } from "@/lib/format"
import { TrendingUp, Coins, Users, ArrowDownToLine } from "lucide-react"

interface Props {
  protocol:     ProtocolData | null
  stakerCount:  number
  totalVolume:  string
}

interface CardDef {
  key:        string
  label:      string
  Icon:       ElementType
  accent:     string
  accentMuted: string
  glowRgb:    string
}

const DEFS: CardDef[] = [
  { key: "tvl",     label: "Total Value Staked",    Icon: TrendingUp, accent: "#7c3aed", accentMuted: "rgba(124,58,237,0.14)",  glowRgb: "124,58,237"  },
  { key: "rewards", label: "Total Rewards Paid",    Icon: Coins,      accent: "#00d4aa", accentMuted: "rgba(0,212,170,0.12)",   glowRgb: "0,212,170"   },
  { key: "stakers", label: "Active Stakers",        Icon: Users,      accent: "#f59e0b", accentMuted: "rgba(245,158,11,0.12)",  glowRgb: "245,158,11"  },
  { key: "volume",  label: "Total Staked Volume",    Icon: ArrowDownToLine, accent: "#6366f1", accentMuted: "rgba(99,102,241,0.12)",  glowRgb: "99,102,241"  },
]

function StatCard({
  label, value, sub, Icon, accent, accentMuted, glowRgb, index,
}: Omit<CardDef, "key"> & { value: string; sub: string; index: number; Icon: ElementType }) {
  return (
    <div
      className="card-accent rounded-xl p-5 relative overflow-hidden fade-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Corner glow */}
      <div
        aria-hidden
        style={{
          position:      "absolute",
          top:           -50,
          right:         -50,
          width:         150,
          height:        150,
          borderRadius:  "50%",
          background:    `radial-gradient(circle, rgba(${glowRgb},0.18) 0%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      <div className="relative flex flex-col gap-4">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily:    "var(--font-ibm-plex-mono), monospace",
              fontSize:      10,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color:         "var(--text-muted)",
            }}
          >
            {label}
          </span>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: accentMuted }}
          >
            <Icon size={14} strokeWidth={1.5} style={{ color: accent }} />
          </div>
        </div>

        {/* Value */}
        <div>
          <p
            className="tabular-nums leading-none"
            style={{
              fontFamily:    "var(--font-syne), sans-serif",
              fontSize:      28,
              fontWeight:    700,
              color:         "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <div style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: accent, opacity: 0.55 }} />
            <span
              style={{
                fontFamily: "var(--font-ibm-plex-mono), monospace",
                fontSize:   11,
                color:      "var(--text-muted)",
              }}
            >
              {sub}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProtocolStats({ protocol, stakerCount, totalVolume }: Props) {
  const tvl  = protocol?.totalValueStaked ? formatToken(BigInt(protocol.totalValueStaked)) : "0.00"
  const paid = protocol?.totalRewardsPaid  ? formatToken(BigInt(protocol.totalRewardsPaid))  : "0.00"
  const vol  = totalVolume ? formatToken(BigInt(totalVolume)) : "0.00"

  const values: Record<string, { value: string; sub: string }> = {
    tvl:     { value: `${tvl} TKA`,          sub: "staking token"               },
    rewards: { value: `${paid} TKB`,          sub: "reward token distributed"    },
    stakers: { value: String(stakerCount),    sub: "ranked by pool share"        },
    volume:  { value: `${vol} TKA`,           sub: "all-time staked volume"      },
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {DEFS.map((def, i) => (
        <StatCard key={def.key} {...def} {...values[def.key]} index={i} />
      ))}
    </div>
  )
}
