import type { Metadata } from "next"
import { Syne, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { ProvidersWrapper } from "./providers-wrapper"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Stakr — DeFi Staking Dashboard",
  description: "Stake TKA, earn TKB. Live on Sepolia testnet.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${ibmPlexMono.variable} dark`}>
      <body
        className="min-h-dvh flex antialiased"
        style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
      >
        <ProvidersWrapper>
          <div className="flex flex-1 min-h-dvh">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-x-hidden">
              <Header />
              {/* Full-width main — each page controls its own internal grid */}
              <main className="flex-1 mesh-bg overflow-y-auto">
                <div className="w-full max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </ProvidersWrapper>
      </body>
    </html>
  )
}
