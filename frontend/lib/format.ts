import { formatUnits } from "viem"

export function formatToken(wei: bigint | string, decimals = 18): string {
  const value = typeof wei === "string" ? BigInt(wei) : wei
  return parseFloat(formatUnits(value, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

export function formatAPR(rewardRate: bigint, totalSupply: bigint): string {
  if (totalSupply === 0n) return "0.00"
  const apr = (Number(rewardRate) * 365 * 24 * 3600 * 100) / Number(totalSupply)
  return apr.toFixed(2)
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function formatTimestamp(ts: string | number): string {
  return new Date(Number(ts) * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatRewardRate(rewardRate: bigint): string {
  const perDay = rewardRate * 86400n
  return parseFloat(formatUnits(perDay, 18)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })
}

export function formatUSD(wei: bigint | string, decimals = 18): string {
  const value = typeof wei === "string" ? BigInt(wei) : wei
  const num = parseFloat(formatUnits(value, decimals))
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
