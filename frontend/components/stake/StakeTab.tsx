"use client"

import { useState } from "react"
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
  useReadContracts,
} from "wagmi"
import { parseUnits } from "viem"
import { ArrowRight, Check } from "lucide-react"
import { STAKING_REWARDS_ADDRESS, TOKEN_A_ADDRESS, erc20Abi } from "@/lib/contracts"
import { formatToken } from "@/lib/format"
import stakingRewardsAbi from "@/lib/abi/StakingRewards.json"

type Phase = "idle" | "approving" | "approved" | "staking" | "done"

export function StakeTab() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState("")

  // Read balances + allowance
  const { data: reads, refetch: refetchReads } = useReadContracts({
    contracts: [
      {
        address: TOKEN_A_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address!],
      },
      {
        address: TOKEN_A_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address!, STAKING_REWARDS_ADDRESS],
      },
    ],
    query: { enabled: !!address },
  })

  const tkaBalance = reads?.[0]?.result as bigint | undefined
  const allowance = reads?.[1]?.result as bigint | undefined

  // Approve tx
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract()
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash })

  // Stake tx
  const {
    writeContract: writeStake,
    data: stakeHash,
    isPending: isStakePending,
    error: stakeError,
    reset: resetStake,
  } = useWriteContract()
  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } =
    useWaitForTransactionReceipt({ hash: stakeHash })

  const amountBig = amount ? parseUnits(amount, 18) : 0n
  const needsApproval = allowance !== undefined && amountBig > 0n && allowance < amountBig
  const canStake = !needsApproval && amountBig > 0n

  // After approve confirms, refetch allowance
  if (isApproveSuccess) refetchReads()
  // After stake confirms, clear
  if (isStakeSuccess) refetchReads()

  const handleMax = () => {
    if (tkaBalance !== undefined) setAmount(formatToken(tkaBalance).replace(/,/g, ""))
  }

  const handleApprove = () => {
    resetApprove()
    writeApprove({
      address: TOKEN_A_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [STAKING_REWARDS_ADDRESS, amountBig],
    })
  }

  const handleStake = () => {
    resetStake()
    writeStake({
      address: STAKING_REWARDS_ADDRESS,
      abi: stakingRewardsAbi,
      functionName: "stake",
      args: [amountBig],
    })
  }

  const error = approveError || stakeError
  const txHash = stakeHash

  if (!isConnected) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: "var(--text-secondary)" }}>
        Connect your wallet to stake.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Amount input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="stake-amount"
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Amount
          </label>
          {tkaBalance !== undefined && (
            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              Balance: {formatToken(tkaBalance)} TKA
            </span>
          )}
        </div>
        <div
          className="flex items-center rounded-lg border overflow-hidden"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border)",
          }}
        >
          <input
            id="stake-amount"
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-sm outline-none tabular-nums placeholder:opacity-30"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-ibm-plex-mono), monospace",
            }}
            min="0"
            step="any"
          />
          <span
            className="px-3 text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-ibm-plex-mono)" }}
          >
            TKA
          </span>
          <button
            type="button"
            onClick={handleMax}
            className="px-3 py-1 text-xs font-medium mr-2 rounded transition-opacity hover:opacity-80 active:scale-97"
            style={{
              backgroundColor: "var(--accent-muted)",
              color: "var(--accent)",
              minHeight: 28,
            }}
          >
            Max
          </button>
        </div>
      </div>

      {/* Step indicator */}
      {amountBig > 0n && (
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
          <span
            className="flex items-center gap-1"
            style={{ color: isApproveSuccess || !needsApproval ? "var(--success)" : "var(--accent)" }}
          >
            {isApproveSuccess || !needsApproval ? (
              <Check size={12} strokeWidth={2} />
            ) : (
              <span className="w-4 h-4 rounded-full border flex items-center justify-center text-xs"
                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}>1</span>
            )}
            Approve
          </span>
          <ArrowRight size={12} />
          <span style={{ color: canStake ? "var(--accent)" : "var(--text-muted)" }}>
            <span className="w-4 h-4 rounded-full border inline-flex items-center justify-center text-xs mr-1"
              style={{
                borderColor: canStake ? "var(--accent)" : "var(--border)",
                color: canStake ? "var(--accent)" : "var(--text-muted)",
              }}>2</span>
            Stake
          </span>
        </div>
      )}

      {/* Action button */}
      {needsApproval ? (
        <button
          onClick={handleApprove}
          disabled={isApprovePending || isApproveConfirming || amountBig === 0n}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-150 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
            minHeight: 48,
            fontFamily: "var(--font-syne), sans-serif",
          }}
        >
          {isApprovePending
            ? "Confirm in wallet..."
            : isApproveConfirming
            ? "Approving..."
            : "Approve TKA"}
        </button>
      ) : (
        <button
          onClick={handleStake}
          disabled={!canStake || isStakePending || isStakeConfirming}
          className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-150 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "var(--accent)",
            color: "#fff",
            minHeight: 48,
            fontFamily: "var(--font-syne), sans-serif",
          }}
        >
          {isStakePending
            ? "Confirm in wallet..."
            : isStakeConfirming
            ? "Staking..."
            : isStakeSuccess
            ? "Staked!"
            : "Stake TKA"}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs" role="alert" aria-live="polite" style={{ color: "var(--error)" }}>
          {error.message.split("\n")[0]}
        </p>
      )}

      {/* Etherscan link */}
      {txHash && isStakeSuccess && (
        <a
          href={`https://sepolia.etherscan.io/tx/${txHash}`}
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
