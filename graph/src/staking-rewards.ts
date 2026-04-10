import {
  OwnershipTransferred as OwnershipTransferredEvent,
  RewardAdded as RewardAddedEvent,
  RewardClaimed as RewardClaimedEvent,
  RewardsDurationUpdated as RewardsDurationUpdatedEvent,
  Staked as StakedEvent,
  Withdrawn as WithdrawnEvent
} from "../generated/StakingRewards/StakingRewards"
import {
  OwnershipTransferred,
  RewardAdded,
  RewardClaimed,
  RewardsDurationUpdated,
  Staked,
  Withdrawn,
  Staker,
  Protocol
} from "../generated/schema"
import { Bytes, BigInt } from "@graphprotocol/graph-ts"

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadOrCreateStaker(address: Bytes): Staker {
  let staker = Staker.load(address)
  if (staker == null) {
    staker = new Staker(address)
    staker.stakedBalance = BigInt.fromI32(0)
    staker.totalRewardsClaimed = BigInt.fromI32(0)
  }
  return staker
}

function loadOrCreateProtocol(): Protocol {
  let id = Bytes.fromUTF8("protocol")
  let protocol = Protocol.load(id)
  if (protocol == null) {
    protocol = new Protocol(id)
    protocol.totalValueStaked = BigInt.fromI32(0)
    protocol.totalRewardsPaid = BigInt.fromI32(0)
  }
  return protocol
}

// ── Event Handlers ────────────────────────────────────────────────────────────

export function handleStaked(event: StakedEvent): void {
  // Immutable event log
  let entity = new Staked(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update staker balance
  let staker = loadOrCreateStaker(event.params.user)
  staker.stakedBalance = staker.stakedBalance.plus(event.params.amount)
  staker.save()

  // Update protocol TVL
  let protocol = loadOrCreateProtocol()
  protocol.totalValueStaked = protocol.totalValueStaked.plus(event.params.amount)
  protocol.save()
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  // Immutable event log
  let entity = new Withdrawn(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.amount = event.params.amount
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update staker balance
  let staker = loadOrCreateStaker(event.params.user)
  staker.stakedBalance = staker.stakedBalance.minus(event.params.amount)
  staker.save()

  // Update protocol TVL
  let protocol = loadOrCreateProtocol()
  protocol.totalValueStaked = protocol.totalValueStaked.minus(event.params.amount)
  protocol.save()
}

export function handleRewardClaimed(event: RewardClaimedEvent): void {
  // Immutable event log
  let entity = new RewardClaimed(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.user = event.params.user
  entity.reward = event.params.reward
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()

  // Update staker lifetime claims
  let staker = loadOrCreateStaker(event.params.user)
  staker.totalRewardsClaimed = staker.totalRewardsClaimed.plus(event.params.reward)
  staker.save()

  // Update protocol total rewards paid
  let protocol = loadOrCreateProtocol()
  protocol.totalRewardsPaid = protocol.totalRewardsPaid.plus(event.params.reward)
  protocol.save()
}

export function handleRewardAdded(event: RewardAddedEvent): void {
  // Immutable event log only — no state entity to update
  let entity = new RewardAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.reward = event.params.reward
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}

export function handleRewardsDurationUpdated(
  event: RewardsDurationUpdatedEvent
): void {
  let entity = new RewardsDurationUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.newDuration = event.params.newDuration
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner
  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  entity.save()
}