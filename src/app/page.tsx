'use client';

import { useAccount, useReadContract } from 'wagmi';
import { STORE_ABI, STORE_ADDR } from '@/lib/contract';
import { useState } from 'react';
import GameCanvas from '@/components/GameCanvas';
import ShipSelect from '@/components/ShipSelect';

export default function Page() {
  const { address, isConnected } = useAccount();
  const [refresh, setRefresh] = useState(0);

  const { data } = useReadContract({
    address: STORE_ADDR,
    abi: STORE_ABI,
    functionName: 'getPlayer',
    args: isConnected && address ? [address] : undefined,
  });

  const currentTier = Number((data as any)?.[0] ?? 1) as 1 | 2 | 3;

  // Ortak genişlik (panel + oyun)
  const COLUMN_MAX = 440; // px

  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#000',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* hepsi tek kolon ve ortada */}
      <div
        style={{
          width: `min(92vw, ${COLUMN_MAX}px)`,
          margin: '0 auto',
        }}
      >
        {/* Panel — sağ/sol dar, oyunla tam aynı genişlikte */}
        <div
          style={{
            background: 'rgba(255,255,255,.06)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
        >
          <ShipSelect onPurchased={() => setRefresh((x) => x + 1)} />
        </div>

        {/* Oyun sahnesi — kesin 3:4 oran (360x480) */}
        <div
          style={{
            position: 'relative',
            width: `min(92vw, ${COLUMN_MAX}px)`,
            margin: '0 auto',
            // 3:4 oran için padding-top (4/3 = 133.333%)
            paddingTop: '133.333%',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#000',
          }}
        >
          {/* Canvas bu kutuyu %100 dolduracak (absolute) */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <GameCanvas
              key={refresh}
              shipTier={currentTier}
              onScored={() => setRefresh((x) => x + 1)}
              onGameOver={() => setRefresh((x) => x + 1)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
