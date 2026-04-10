# Subgraph

The Graph subgraph that indexes all StakingRewards protocol events on Sepolia into a queryable GraphQL API.

Live endpoint:
```
https://api.studio.thegraph.com/query/1747630/staking-rewards/version/latest
```

---

## What It Indexes

Every `Staked`, `Withdrawn`, `RewardClaimed`, `RewardAdded`, and `RewardsDurationUpdated` event emitted by the StakingRewards contract.

### Entity Types

**Immutable event logs** — one record created per event, never updated:

| Entity | Fields |
|---|---|
| `Staked` | user, amount, blockTimestamp, transactionHash |
| `Withdrawn` | user, amount, blockTimestamp, transactionHash |
| `RewardClaimed` | user, reward, blockTimestamp, transactionHash |
| `RewardAdded` | reward, blockTimestamp |
| `RewardsDurationUpdated` | newDuration, blockTimestamp |

**Mutable state entities** — updated in place as events arrive:

| Entity | Fields | Description |
|---|---|---|
| `Staker` | id, stakedBalance, totalRewardsClaimed | One record per user, tracks current state |
| `Protocol` | id, totalValueStaked, totalRewardsPaid | Singleton, tracks protocol-wide totals |

---

## Setup

Install the Graph CLI:

```bash
npm install -g @graphprotocol/graph-cli
```

Authenticate with your deploy key from [The Graph Studio](https://thegraph.com/studio):

```bash
graph auth
```

---

## Commands

```bash
# Generate AssemblyScript types from schema + ABI
graph codegen

# Compile mappings to WASM
graph build

# Deploy to The Graph Studio
graph deploy staking-rewards
```

---

## Example Queries

**Protocol totals:**
```graphql
{
  protocol(id: "0x70726f746f636f6c") {
    totalValueStaked
    totalRewardsPaid
  }
}
```

**Top stakers:**
```graphql
{
  stakers(first: 10, orderBy: stakedBalance, orderDirection: desc) {
    id
    stakedBalance
    totalRewardsClaimed
  }
}
```

**Recent staking activity:**
```graphql
{
  stakeds(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
    user
    amount
    blockTimestamp
    transactionHash
  }
}
```

---

## Structure

```
graph/
├── abis/
│   └── StakingRewards.json   # ABI exported from contract via make abi-export
├── src/
│   └── staking-rewards.ts    # AssemblyScript event handlers
├── schema.graphql             # Entity definitions
├── subgraph.yaml              # Manifest — contract address, network, event handlers
└── package.json
```

---

## Notes

- `startBlock: 10608903` — deployment block, avoids scanning the entire chain history
- The Protocol singleton uses id `"protocol"` stored as bytes (`0x70726f746f636f6c`)
- Subgraph is deployed to The Graph Studio (centralized) — not the decentralized network
- No API key required for the Studio endpoint