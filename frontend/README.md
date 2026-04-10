# Frontend

**Stakr** — a DeFi staking dashboard built with Next.js 15. Connect your wallet, stake TKA tokens, earn TKB rewards, and track protocol analytics.

Live data comes from the contract via wagmi. Historical and aggregate data comes from The Graph subgraph via GraphQL.

---

## Pages

**Stake** — the action page. Shows live reward rate, pool size, your position and pending rewards. Tabs for staking, unstaking, and withdrawing. Claim button for pending TKB rewards. Faucet button for testers to get TKA.

**Analytics** — the data page. Protocol-wide stats (TVL, total rewards paid, active stakers), staking activity chart, and a leaderboard of top stakers — all from the subgraph.

---

## Stack

| Layer | Library |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Contract reads/writes | wagmi v2 + viem |
| Wallet connection | RainbowKit |
| Subgraph queries | graphql-request |
| Charts | Recharts |
| UI components | shadcn/ui + Tailwind CSS |
| Icons | Lucide React |

---

## Setup

```bash
npm install
cp .env.example .env.local
```

Add your WalletConnect project ID to `.env.local`:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

Get a free project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Network:** Sepolia testnet only. Make sure your wallet is connected to Sepolia. The app will prompt you to switch if you're on the wrong network.

---

## Getting Test Tokens

TokenA (TKA) has a built-in faucet. Click **"Get 100 TKA"** on the Stake page to mint 100 TKA directly to your wallet. The faucet has a 24-hour cooldown per address.

---

## Data Architecture

The app uses two data sources and never mixes them:

| Data | Source |
|---|---|
| User staked balance, pending rewards, allowance | Contract — wagmi `useReadContract` |
| Reward rate, period finish, total supply | Contract — wagmi `useReadContracts` |
| Protocol TVL, total rewards paid | Subgraph — Server Component |
| Staking activity history (charts) | Subgraph — Server Component |
| Stakers leaderboard | Subgraph — Server Component |

Subgraph queries run in Server Components at request time. wagmi hooks run in Client Components in the browser.

---

## Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Providers, fonts, global styles
│   ├── providers.tsx        # WagmiProvider + RainbowKit + QueryClient
│   ├── globals.css          # CSS variables, base styles
│   ├── stake/page.tsx       # Stake page
│   └── analytics/page.tsx   # Analytics page (fetches subgraph)
├── components/
│   ├── layout/             # Sidebar, Header
│   ├── stake/              # StakeCard, StakeTab, UnstakeTab, ClaimButton, FaucetButton
│   └── analytics/          # ProtocolStats, StakeChart, StakersTable
└── lib/
    ├── wagmi.ts            # wagmi config
    ├── contracts.ts         # addresses + ABIs
    ├── format.ts            # token formatting utilities
    ├── subgraph.ts          # graphql-request queries
    └── abi/
        └── StakingRewards.json
```

---

## Contract Addresses (Sepolia)

| Contract | Address |
|---|---|
| StakingRewards | `0xd2102D8e2607908b369bB72B2BbDA6d421fFbF01` |
| TokenA (TKA) | `0xFF7FcC43310c04A0fbc8849fFA6bed251C1B7872` |
| TokenB (TKB) | `0x11e249887f46262805Fc7bc3cf08035B4C7204E2` |