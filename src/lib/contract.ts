// Kontrat adresi .env.local’dan
const FALLBACK_ADDR = '0x0000000000000000000000000000000000000000' as const;
export const STORE_ADDR = (process.env.NEXT_PUBLIC_STORE_ADDR ?? FALLBACK_ADDR) as `0x${string}`;

export const STORE_ABI = [
  {
    type: 'function',
    name: 'buyTier',
    stateMutability: 'payable',
    inputs: [{ name: 'targetTier', type: 'uint8' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'submitScore',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'score', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getPlayer',
    stateMutability: 'view',
    inputs: [{ name: 'u', type: 'address' }],
    outputs: [
      { name: 'tier', type: 'uint8' },
      { name: 'best', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getLeaderboard',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'addrs', type: 'address[20]' },
      { name: 'scores', type: 'uint256[20]' },
    ],
  },
  {
    type: 'function',
    name: 'tierPriceUsdCents',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint8' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'usdCentsToWei',
    stateMutability: 'view',
    inputs: [{ name: 'cents', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export type StoreAbi = typeof STORE_ABI;
