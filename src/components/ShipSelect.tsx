'use client';

import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useConnect,
} from 'wagmi';
import type { Connector } from 'wagmi';
import { STORE_ABI, STORE_ADDR } from '@/lib/contract';
import { formatEther } from 'viem';
import { useMemo, useState } from 'react';

export default function ShipSelect({ onPurchased }: { onPurchased: () => void }) {
  const { isConnected } = useAccount();
  const pc = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { connectAsync, connectors } = useConnect();

  const [hash, setHash] = useState<`0x${string}` | null>(null);
  const { isLoading: isMining } = useWaitForTransactionReceipt({ hash: hash ?? undefined });

  // Fiyat etiketleri
  const { data: p1 } = useReadContract({
    address: STORE_ADDR,
    abi: STORE_ABI,
    functionName: 'usdCentsToWei',
    args: [500n],
  });
  const { data: p2 } = useReadContract({
    address: STORE_ADDR,
    abi: STORE_ABI,
    functionName: 'usdCentsToWei',
    args: [1000n],
  });
  const { data: p3 } = useReadContract({
    address: STORE_ADDR,
    abi: STORE_ABI,
    functionName: 'usdCentsToWei',
    args: [2000n],
  });

  const labels = useMemo(() => {
    const f = (v: unknown) => (typeof v === 'bigint' ? `~${formatEther(v)} ETH` : '...');
    return { t1: f(p1), t2: f(p2), t3: f(p3) };
  }, [p1, p2, p3]);

  async function ensureFarcaster() {
    if (isConnected) return;

    // farcaster geçen bir connector tercih et; yoksa ilk connector
    const fc: Connector | undefined =
      connectors.find(
        (c) =>
          c.name?.toLowerCase().includes('farcaster') ||
          c.id?.toLowerCase().includes('farcaster')
      ) ?? connectors[0];

    if (!fc) {
      alert('Uygun bir cüzdan bağlayıcı bulunamadı. Lütfen Farcaster uygulamasını açın.');
      throw new Error('No available connector');
    }

    try {
      await connectAsync({ connector: fc });
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null
          ? 
            ((err as { shortMessage?: string; message?: string }).shortMessage ??
              (err as { message?: string }).message ??
              'Cüzdan bağlanamadı.')
          : String(err);
      alert(msg);
      throw err;
    }
  }

  async function buy(tier: 1 | 2 | 3) {
    try {
      await ensureFarcaster();
      if (!pc) {
        alert('Ağ istemcisi yüklenemedi, sayfayı yenileyin.');
        return;
      }

      const cents = tier === 1 ? 500n : tier === 2 ? 1000n : 2000n;
      const price = (await pc.readContract({
        address: STORE_ADDR,
        abi: STORE_ABI,
        functionName: 'usdCentsToWei',
        args: [cents],
      })) as bigint;

      const txHash = await writeContractAsync({
        address: STORE_ADDR,
        abi: STORE_ABI,
        functionName: 'buyTier',
        args: [tier],
        value: price,
      });

      setHash(txHash);
      onPurchased(); // aktif tier ekranda güncellensin
    } catch (err: unknown) {
      const isRejected =
        typeof err === 'object' &&
        err !== null &&
        String((err as { message?: string }).message ?? '')
          .toLowerCase()
          .includes('user rejected');

      if (!isRejected) {
        const msg =
          typeof err === 'object' && err !== null
            ?
              ((err as { shortMessage?: string; message?: string }).shortMessage ??
                (err as { message?: string }).message ??
                'İşlem hatası.')
            : String(err);
        alert(msg);
      }
    }
  }

  const disabled = isMining; // sadece tx sırasında kilitlenir

  return (
    <div style={{ borderRadius: 16, padding: 16, background: 'rgba(255,255,255,.06)' }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Gemi Yükselt (Satın Al)</div>
      <div style={{ opacity: 0.85, fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>
        <div>Tier 1: {labels.t1} (~$5)</div>
        <div>Tier 2: {labels.t2} (~$10)</div>
        <div>Tier 3: {labels.t3} (~$20)</div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button disabled={disabled} onClick={() => buy(1)}>
          Tier 1 Satın Al
        </button>
        <button disabled={disabled} onClick={() => buy(2)}>
          Tier 2 Satın Al
        </button>
        <button disabled={disabled} onClick={() => buy(3)}>
          Tier 3 Satın Al
        </button>
      </div>

      {hash && (
        <div style={{ fontSize: 12, marginTop: 8, wordBreak: 'break-all' }}>
          Tx: {hash}
        </div>
      )}
    </div>
  );
}
