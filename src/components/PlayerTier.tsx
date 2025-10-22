'use client';
import { useAccount, useReadContract } from 'wagmi';
import { STORE_ABI, STORE_ADDR } from '@/lib/contract';

export function PlayerTier() {
  const { address, isConnected } = useAccount();
  const { data } = useReadContract({
    address: STORE_ADDR, abi: STORE_ABI,
    functionName: 'getPlayer',
    args: isConnected && address ? [address] : undefined,
  });
  if (!isConnected) return null;
  const tier = (data as any)?.[0] as number | undefined;
  return <div className="text-xs opacity-80">Mevcut Tier: {tier ?? 0}</div>;
}
export default PlayerTier;
