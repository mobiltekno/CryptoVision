'use client';
import { useAccount, useReadContract } from 'wagmi';
import { STORE_ABI, STORE_ADDR } from '@/lib/contract';

type PlayerTuple = readonly [bigint, bigint] | undefined;

export default function PlayerTier() {
  const { address, isConnected } = useAccount();

  const { data, isLoading } = useReadContract({
    address: STORE_ADDR,
    abi: STORE_ABI,
    functionName: 'getPlayer',
    args: isConnected && address ? [address] : undefined,
  });

  const player = data as PlayerTuple;
  const tier = player ? Number(player[0]) : 1;

  if (isLoading) return <span>Yükleniyor…</span>;
  return <span>Aktif Tier: {tier}</span>;
}
