"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, BarChart2, Wifi } from "lucide-react"

const NAV = [
  { href: "/stake",     label: "Stake",     Icon: Layers    },
  { href: "/analytics", label: "Analytics", Icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* ── Desktop / Tablet sidebar ── */}
      <aside
        className="stakr-sidebar hidden md:flex flex-col shrink-0 border-r"
        style={{
          /* icon-only on md (768–1023px), full on lg (1024px+) */
          width:           "var(--sidebar-w-md)",
          backgroundColor: "var(--bg-surface)",
          borderColor:     "var(--border)",
          minHeight:       "100dvh",
          position:        "sticky",
          top:             0,
        }}
      >
        {/* Override width on lg */}
        <style>{`
          @media (min-width: 1024px) {
            aside.stakr-sidebar { width: var(--sidebar-w) !important; }
          }
        `}</style>

        {/* Logo */}
        <div
          className="flex items-center gap-3 px-4 lg:px-5 border-b shrink-0"
          style={{
            height:      "var(--header-h)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #4f1fad 100%)",
              boxShadow:  "0 0 16px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-syne), sans-serif",
                fontWeight: 800,
                fontSize:   14,
                color:      "#fff",
              }}
            >
              S
            </span>
          </div>
          {/* Text: hidden on md, shown on lg */}
          <span
            className="hidden lg:block whitespace-nowrap overflow-hidden p-4"
            style={{
              fontFamily:    "var(--font-syne), sans-serif",
              fontWeight:    700,
              fontSize:      18,
              color:         "var(--text-primary)",
              letterSpacing: "-0.025em",
            }}
          >
            Stakr
          </span>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-2 lg:p-3 flex-1" aria-label="Main navigation">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className="flex items-center gap-3 rounded-xl transition-all duration-150 group"
                style={{
                  padding:         "10px 12px",
                  backgroundColor: active ? "var(--accent-muted)" : "transparent",
                  border:          active
                    ? "1px solid var(--accent-border)"
                    : "1px solid transparent",
                  color:           active ? "var(--accent)" : "var(--text-secondary)",
                  minHeight:       44,
                  justifyContent:  "center",
                }}
                /* lg: justify start */
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.04)"
                    ;(e.currentTarget as HTMLAnchorElement).style.color = "var(--text-primary)"
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent"
                    ;(e.currentTarget as HTMLAnchorElement).style.color = "var(--text-secondary)"
                  }
                }}
              >
                <Icon
                  size={17}
                  strokeWidth={active ? 2 : 1.5}
                  style={{ flexShrink: 0 }}
                />
                <span
                  className="hidden lg:block text-sm whitespace-nowrap overflow-hidden"
                  style={{
                    fontFamily: "var(--font-syne), sans-serif",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Network badge */}
        <div className="p-2 lg:p-3 shrink-0">
          <div
            className="flex items-center gap-2 rounded-xl px-3"
            style={{
              height:          40,
              backgroundColor: "var(--bg-elevated)",
              border:          "1px solid var(--border)",
              justifyContent:  "center",
            }}
          >
            <Wifi size={11} strokeWidth={1.5} style={{ color: "var(--success)", flexShrink: 0 }} />
            <span
              className="hidden lg:block text-xs whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ color: "var(--text-muted)", fontFamily: "var(--font-ibm-plex-mono), monospace" }}
            >
              Sepolia Testnet
            </span>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex border-t"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor:     "var(--border)",
          paddingBottom:   "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Mobile navigation"
      >
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center gap-1 py-3 justify-center transition-colors duration-150"
              style={{
                color:     active ? "var(--accent)" : "var(--text-secondary)",
                minHeight: 56,
              }}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span
                style={{
                  fontSize:   10,
                  fontFamily: "var(--font-syne), sans-serif",
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
