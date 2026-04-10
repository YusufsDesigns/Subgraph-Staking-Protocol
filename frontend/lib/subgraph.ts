import { request, gql } from "graphql-request"

export const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_URL ??
  "https://api.studio.thegraph.com/query/1747630/staking-rewards/version/latest"

export interface ProtocolData {
  totalValueStaked: string
  totalRewardsPaid: string
}

export interface StakerData {
  id: string
  stakedBalance: string
  totalRewardsClaimed: string
}

export interface StakeEvent {
  user: string
  amount: string
  blockTimestamp: string
}

export interface WithdrawEvent {
  user: string
  amount: string
  blockTimestamp: string
}

export interface AnalyticsData {
  protocol: ProtocolData | null
  stakers: StakerData[]
  stakeds: StakeEvent[]
  withdrawns: WithdrawEvent[]
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const query = gql`
    {
      protocol(id: "0x70726f746f636f6c") {
        totalValueStaked
        totalRewardsPaid
      }
      stakers(first: 20, orderBy: stakedBalance, orderDirection: desc) {
        id
        stakedBalance
        totalRewardsClaimed
      }
      stakeds(first: 100, orderBy: blockTimestamp, orderDirection: asc) {
        user
        amount
        blockTimestamp
      }
      withdrawns(first: 100, orderBy: blockTimestamp, orderDirection: asc) {
        user
        amount
        blockTimestamp
      }
    }
  `
  try {
    return await request<AnalyticsData>(SUBGRAPH_URL, query)
  } catch {
    return { protocol: null, stakers: [], stakeds: [], withdrawns: [] }
  }
}
