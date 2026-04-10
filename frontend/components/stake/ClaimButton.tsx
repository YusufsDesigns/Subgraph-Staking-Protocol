"use client"

import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi"
import { Gift } from "lucide-react"
import { STAKING_REWARDS_ADDRESS } from "@/lib/contracts"
import { formatToken } from "@/lib/format"
import stakingRewardsAbi from "@/lib/abi/StakingRewards.json"

export function ClaimButton() {
  const { address, isConnected } = useAccount()

  const { data: earned, refetch } = useReadContract({
    address: STAKING_REWARDS_ADDRESS,
    abi: stakingRewardsAbi,
    functionName: "earned",
    args: [address!],
    query: { enabled: !!address, refetchInterval: 10_000 },
  })

  const { writeContract, data: hash, isPending, error, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const earnedBig = earned as bigint | undefined
  const hasRewards = earnedBig !== undefined && earnedBig > 0n

  if (isSuccess) {
    refetch()
  }

  const label = isPending
    ? "Confirm in wallet..."
    : isConfirming
    ? "Claiming..."
    : isSuccess
    ? "Claimed!"
    : "Claim TKB Rewards"

  if (!isConnected) return null

  return (
    <div className="flex flex-col gap-2">
      {earnedBig !== undefined && (
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Pending:{" "}
          <span
            className="tabular-nums"
            style={{ color: "var(--success)", fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            {formatToken(earnedBig)} TKB
          </span>
        </p>
      )}

      <button
        onClick={() => {
          reset()
          writeContract({
            address: STAKING_REWARDS_ADDRESS,
            abi: stakingRewardsAbi,
            functionName: "claimReward",
          })
        }}
        disabled={!hasRewards || isPending || isConfirming}
        aria-label="Claim all pending TKB rewards"
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 active:scale-97 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          backgroundColor: "var(--accent-muted)",
          color: "var(--accent)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          minHeight: 44,
        }}
      >
        <Gift size={14} strokeWidth={1.5} />
        {label}
      </button>

      {error && (
        <p className="text-xs" role="alert" aria-live="polite" style={{ color: "var(--error)" }}>
          {error.message.split("\n")[0]}
        </p>
      )}

      {hash && isSuccess && (
        <a
          href={`https://sepolia.etherscan.io/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline underline-offset-2 transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          View on Etherscan ↗
        </a>
      )}
    </div>
  )
}
