"use client"

import { useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi"
import { Droplets } from "lucide-react"
import { TOKEN_A_ADDRESS, erc20Abi } from "@/lib/contracts"

export function FaucetButton() {
  const { isConnected } = useAccount()
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const label = isPending
    ? "Confirm in wallet..."
    : isConfirming
    ? "Minting..."
    : isSuccess
    ? "Minted! +100 TKA"
    : "Get 100 TKA"

  if (!isConnected) return null

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() =>
          writeContract({
            address: TOKEN_A_ADDRESS,
            abi: erc20Abi,
            functionName: "faucet",
          })
        }
        disabled={isPending || isConfirming}
        aria-label="Mint 100 TKA test tokens from faucet"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: "var(--bg-elevated)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
          minHeight: 44,
        }}
      >
        <Droplets size={14} strokeWidth={1.5} />
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
