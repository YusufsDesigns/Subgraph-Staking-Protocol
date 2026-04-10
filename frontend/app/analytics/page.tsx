export const dynamic = "force-dynamic"

import { getAnalyticsData } from "@/lib/subgraph"
import { ProtocolStats }    from "@/components/analytics/ProtocolStats"
import { StakeChart }       from "@/components/analytics/StakeChart"
import { StakersTable }     from "@/components/analytics/StakersTable"

export const metadata = { title: "Analytics — Stakr" }

export default async function AnalyticsPage() {
  const data        = await getAnalyticsData()
  const totalVolume = data.stakeds
    .reduce((acc: bigint, e: { amount: string }) => acc + BigInt(e.amount), 0n)
    .toString()

  return (
    <div className="flex flex-col gap-5 w-full">

      {/* Page header */}
      <div className="fade-up">
        <div className="flex items-center gap-2.5 mb-1">
          <div style={{ width: 3, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #7c3aed, #4f1fad)", flexShrink: 0 }} />
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            Analytics
          </h1>
        </div>
        <p className="pl-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          Protocol-wide statistics from on-chain data via The Graph.
        </p>
      </div>

      {/* 4-column stat cards — full width */}
      <ProtocolStats
        protocol={data.protocol}
        stakerCount={data.stakers.length}
        totalVolume={totalVolume}
      />

      {/* 2-column: chart (2/3) + leaderboard (1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div className="xl:col-span-2">
          <StakeChart stakeds={data.stakeds} withdrawns={data.withdrawns} />
        </div>
        <div className="xl:col-span-1">
          <StakersTable stakers={data.stakers} />
        </div>
      </div>

    </div>
  )
}
