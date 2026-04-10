# Staking Protocol

A full-stack DeFi project built as a learning exercise in protocol development, on-chain data indexing, and Web3 frontend integration. Users stake TKA tokens and earn TKB rewards proportional to their pool share and staking duration.

Three layers, each independently deployable:

- **Contract** — Solidity staking protocol deployed on Sepolia
- **Subgraph** — The Graph subgraph indexing all protocol events into a GraphQL API
- **Frontend** — Next.js 15 dashboard for staking, claiming, and analytics

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Stakr Dashboard                      │
│              (Next.js 15 · wagmi · RainbowKit)           │
└──────────────────┬──────────────────┬───────────────────┘
                   │                  │
         Live data │           Historical data
         (wagmi)   │           (graphql-request)
                   │                  │
    ┌──────────────▼──┐    ┌──────────▼──────────┐
    │  StakingRewards  │    │   The Graph Studio   │
    │  TokenA · TokenB │    │   (Subgraph · WASM)  │
    │  Sepolia Testnet │    │   Sepolia Testnet    │
    └──────────────────┘    └──────────────────────┘
```

---

## Project Structure

```
staking-protocol/
├── contract/          # Foundry project — Solidity contracts + tests
├── graph/             # The Graph subgraph — schema, mappings, manifest
└── frontend/          # Next.js 15 dashboard
```

---

## Deployed Contracts (Sepolia)

| Contract | Address |
|---|---|
| StakingRewards | `0xd2102D8e2607908b369bB72B2BbDA6d421fFbF01` |
| TokenA (TKA) | `0xFF7FcC43310c04A0fbc8849fFA6bed251C1B7872` |
| TokenB (TKB) | `0x11e249887f46262805Fc7bc3cf08035B4C7204E2` |

All contracts are verified on [Sepolia Etherscan](https://sepolia.etherscan.io).

---

## Subgraph

Live on The Graph Studio:
```
https://api.studio.thegraph.com/query/1747630/staking-rewards/version/latest
```

---

## Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh)
- [Graph CLI](https://thegraph.com/docs/en/developing/creating-a-subgraph/#install-the-graph-cli)
- Node.js 18+
- A WalletConnect project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com)

### Run the frontend locally

```bash
cd frontend
cp .env.example .env.local
# Add your WalletConnect project ID to .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run contract tests

```bash
cd contract
forge test
```

---

## How It Works

### Staking

1. Users call `TokenA.approve(stakingRewards, amount)`
2. Users call `StakingRewards.stake(amount)` — TKA is transferred in
3. Rewards accrue every block proportional to the user's share of the pool
4. Users call `claimReward()` to receive TKB
5. Users call `withdraw(amount)` or `exit()` to unstake

### Reward Distribution

Follows the Synthetix StakingRewards pattern. A global `rewardPerToken` accumulator snapshots reward state before every state change. Users earn:

```
earned = balance × (rewardPerToken - userRewardPerTokenPaid) + pendingRewards
```

### Subgraph Indexing

Every `Staked`, `Withdrawn`, `RewardClaimed`, and `RewardAdded` event is indexed into two entity types:

- **Immutable event logs** — historical record of every action
- **Mutable state entities** — current staked balances and protocol totals

The frontend reads live user data directly from the contract via wagmi, and historical/aggregate data from the subgraph via GraphQL.

---

## Testing

The contract has full unit, fuzz, and invariant test coverage using Foundry.

```bash
cd contract
forge test -vv          # unit + fuzz
forge test --mt invariant  # invariant suite
```

Key invariants tested:
- `totalSupply` always equals the sum of all staker balances
- Contract's TKA balance always covers all staker withdrawals
- Earned rewards never exceed the contract's TKB balance
- Reward rate never exceeds the contract's TKB balance

---

## Testnet Tokens

TokenA (TKA) has a built-in faucet — call `faucet()` on the contract or use the "Get 100 TKA" button in the dashboard. The faucet mints 100 TKA per address with a 24-hour cooldown.