"use client"

import { useState } from "react"
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useReadContract,
} from "wagmi"
import { parseUnits } from "viem"
import { STAKING_REWARDS_ADDRESS } from "@/lib/contracts"
import { formatToken } from "@/lib/format"
import stakingRewardsAbi from "@/lib/abi/StakingRewards.json"

export function UnstakeTab() {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState("")

  const { data: stakedBalance, refetch } = useReadContract({
    address: STAKING_REWARDS_ADDRESS,
    abi: stakingRewardsAbi,
    functionName: "balanceOf",
    args: [address!],
    query: { enabled: !!address },
  })

  const staked = stakedBalance as bigint | undefined

  // Partial withdraw
  const { writeContract: writeWithdraw, data: withdrawHash, isPending: isWithdrawPending, error: withdrawError, reset: resetWithdraw } =
    useWriteContract()
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash })

  // Exit (withdraw all + claim)
  const { writeContract: writeExit, data: exitHash, isPending: isExitPending, error: exitError, reset: resetExit } =
    useWriteContract()
  const { isLoading: isExitConfirming, isSuccess: isExitSuccess } =
    useWaitForTransactionReceipt({ hash: exitHash })

  const amountBig = amount ? parseUnits(amount, 18) : 0n

  if (isWithdrawSuccess || isExitSuccess) refetch()

  const handleMax = () => {
    if (staked !== undefined) setAmount(formatToken(staked).replace(/,/g, ""))
  }

  const handleWithdraw = () => {
    resetWithdraw()
    writeWithdraw({
      address: STAKING_REWARDS_ADDRESS,
      abi: stakingRewardsAbi,
      functionName: "withdraw",
      args: [amountBig],
    })
  }

  const handleExit = () => {
    resetExit()
    writeExit({
      address: STAKING_REWARDS_ADDRESS,
      abi: stakingRewardsAbi,
      functionName: "exit",
    })
  }

  const error = withdrawError || exitError
  const txHash = withdrawHash || exitHash
  const isSuccess = isWithdrawSuccess || isExitSuccess

  if (!isConnected) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: "var(--text-secondary)" }}>
        Connect your wallet to unstake.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Amount input */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="unstake-amount"
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Amount to withdraw
          </label>
          {staked !== undefined && (
            <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
              Staked: {formatToken(staked)} TKA
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
            id="unstake-amount"
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

      {/* Partial withdraw button */}
      <button
        onClick={handleWithdraw}
        disabled={amountBig === 0n || isWithdrawPending || isWithdrawConfirming || isExitPending || isExitConfirming}
        className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-150 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: "var(--accent)",
          color: "#fff",
          minHeight: 48,
          fontFamily: "var(--font-syne), sans-serif",
        }}
      >
        {isWithdrawPending
          ? "Confirm in wallet..."
          : isWithdrawConfirming
          ? "Withdrawing..."
          : isWithdrawSuccess
          ? "Withdrawn!"
          : "Withdraw TKA"}
      </button>

      {/* Separator */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
      </div>

      {/* Exit button */}
      <button
        onClick={handleExit}
        disabled={!staked || staked === 0n || isExitPending || isExitConfirming || isWithdrawPending || isWithdrawConfirming}
        className="w-full py-3 rounded-lg text-sm font-medium transition-all duration-150 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          minHeight: 48,
          fontFamily: "var(--font-syne), sans-serif",
        }}
      >
        {isExitPending
          ? "Confirm in wallet..."
          : isExitConfirming
          ? "Exiting..."
          : isExitSuccess
          ? "Done!"
          : "Withdraw All + Claim Rewards"}
      </button>

      {error && (
        <p className="text-xs" role="alert" aria-live="polite" style={{ color: "var(--error)" }}>
          {error.message.split("\n")[0]}
        </p>
      )}

      {txHash && isSuccess && (
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
