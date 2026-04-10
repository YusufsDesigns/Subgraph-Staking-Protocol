export const STAKING_REWARDS_ADDRESS = (process.env.NEXT_PUBLIC_STAKING_REWARDS_ADDRESS ?? "0xd2102D8e2607908b369bB72B2BbDA6d421fFbF01") as `0x${string}`
export const TOKEN_A_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_A_ADDRESS ?? "0xFF7FcC43310c04A0fbc8849fFA6bed251C1B7872") as `0x${string}`
export const TOKEN_B_ADDRESS = (process.env.NEXT_PUBLIC_TOKEN_B_ADDRESS ?? "0x11e249887f46262805Fc7bc3cf08035B4C7204E2") as `0x${string}`
export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? "11155111")

export const erc20Abi = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    name: "faucet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
] as const
