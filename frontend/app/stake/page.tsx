export const dynamic = "force-dynamic"

import { Suspense }    from "react"
import { StakeCard }   from "@/components/stake/StakeCard"
import { StakeStats }  from "@/components/stake/StakeStats"

export const metadata = { title: "Stake — Stakr" }

function CardSkeleton() {
  return (
    <div className="card-accent rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-card)" }}>
      <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="skeleton h-3 w-20 mb-3" />
        <div className="skeleton h-12 w-28 mb-4" />
        <div className="skeleton h-3 w-40" />
      </div>
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex-1 py-3 px-5"><div className="skeleton h-3 w-10 mx-auto" /></div>
        <div className="flex-1 py-3 px-5"><div className="skeleton h-3 w-14 mx-auto" /></div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-12 rounded-xl" />
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="skeleton h-5 w-36" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => (
          <div key={i} className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)" }}>
            <div className="skeleton h-3 w-16 mb-3" />
            <div className="skeleton h-6 w-24 mb-2" />
            <div className="skeleton h-2.5 w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StakePage() {
  return (
    <div className="flex flex-col gap-5 w-full">

      {/* Page header */}
      <div className="fade-up">
        <div className="flex items-center gap-2.5 mb-1">
          <div style={{ width: 3, height: 22, borderRadius: 2, background: "linear-gradient(to bottom, #7c3aed, #4f1fad)", flexShrink: 0 }} />
          <h1 style={{ fontFamily: "var(--font-syne), sans-serif", fontWeight: 700, fontSize: 22, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            Stake TKA
          </h1>
        </div>
        <p className="pl-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          Deposit TKA · earn TKB rewards · proportional to your pool share
        </p>
      </div>

      {/* 2-column layout: card + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* Left: stake card — wider */}
        <div className="lg:col-span-3">
          <Suspense fallback={<CardSkeleton />}>
            <StakeCard />
          </Suspense>
        </div>

        {/* Right: protocol stats panel */}
        <div className="lg:col-span-2">
          <Suspense fallback={<StatsSkeleton />}>
            <StakeStats />
          </Suspense>
        </div>

      </div>
    </div>
  )
}
