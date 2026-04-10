# Contract

Solidity staking protocol built with Foundry. Users stake TokenA (TKA) and earn TokenB (TKB) over time, proportional to their share of the pool and duration staked.

Follows the [Synthetix StakingRewards](https://github.com/Synthetixio/synthetix/blob/develop/contracts/StakingRewards.sol) pattern.

---

## Contracts

| Contract | Description |
|---|---|
| `StakingRewards.sol` | Core staking logic — stake, withdraw, claim, reward distribution |
| `TokenA.sol` | ERC20 staking token with owner mint and public faucet |
| `TokenB.sol` | ERC20 reward token, owner-controlled |
| `interfaces/IStakingRewards.sol` | Interface defining the public API |

---

## Deployed (Sepolia)

| Contract | Address |
|---|---|
| StakingRewards | `0xd2102D8e2607908b369bB72B2BbDA6d421fFbF01` |
| TokenA (TKA) | `0xFF7FcC43310c04A0fbc8849fFA6bed251C1B7872` |
| TokenB (TKB) | `0x11e249887f46262805Fc7bc3cf08035B4C7204E2` |

---

## Setup

```bash
forge install
```

Copy the environment template:

```bash
cp .env.example .env
```

Required `.env` variables:

```env
SEPOLIA_RPC_URL=
DEPLOYER_ADDRESS=
ETHERSCAN_API_KEY=
TOKEN_A_ADDRESS=   # optional — leave blank to deploy fresh
TOKEN_B_ADDRESS=   # optional — leave blank to deploy fresh
```

> **Note:** No private keys in `.env`. Deployment uses an encrypted Foundry keystore via `--account`.

---

## Commands

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvvv

# Run only invariant tests
forge test --mt invariant

# Deploy to local Anvil
make deploy

# Deploy to Sepolia
make deploy-sepolia ACCOUNT=<keystore-name>

# Export ABI to subgraph
make abi-export
```

---

## Test Coverage

| Type | Files | Description |
|---|---|---|
| Unit | `test/unit/StakingRewardsTest.t.sol` | Constructor, stake, withdraw, claim, exit, notifyRewardAmount, earned, rewardPerToken |
| Fuzz | Same file | Stake/withdraw round trips, earned bounds, totalSupply consistency |
| Invariant | `test/invariant/` | 6 protocol-level invariants via handler-based fuzzing |

### Invariants

- `totalSupply` equals the sum of all individual balances
- Contract's TKA balance always covers all stakers
- `earned(user)` never exceeds the contract's TKB balance
- Reward rate never exceeds the contract's TKB balance
- Ghost tracking matches on-chain state

---

## Reward Math

```
rewardPerToken =
  rewardPerTokenStored
  + (rewardRate × (lastTimeApplicable - lastUpdateTime) × 1e18) / totalSupply

earned(user) =
  (balance × (rewardPerToken - userRewardPerTokenPaid) / 1e18)
  + rewards[user]
```

The `updateReward` modifier snapshots this accumulator before every state-changing function.

---

## Security Notes

- `nonReentrant` on `stake`, `withdraw`, `claimReward`
- CEI (Checks-Effects-Interactions) strictly followed on all state-changing functions
- `notifyRewardAmount` requires tokens to be transferred to the contract **before** calling — not approve + pull
- Custom errors used throughout for gas efficiency
- No private keys ever stored in `.env` or scripts