'use client';
import { useAccount, useReadContract } from 'wagmi';
import GameCanvas from '@/components/GameCanvas';
import ShipSelect from '@/components/ShipSelect';
import { STORE_ABI, STORE_ADDR } from '@/lib/contract';
import { useState } from 'react';

// getPlayer dönüşünü tipliyoruz (örnek: [tier, highScore] gibi)
type PlayerTuple = readonly [bigint, bigint] | undefined;

export default function Page() {
  const { address, isConnected } = useAccount();
  const [refresh, setRefresh] = useState(0);

  const { data } = useReadContract({
    address: STORE_ADDR,
    abi: STORE_ABI,
    functionName: 'getPlayer',
    args: isConnected && address ? [address] : undefined,
  });

  const player = data as PlayerTuple;
  const currentTier = (player ? Number(player[0]) : 1) as 1 | 2 | 3;

  return (
    <main
      style={{
        minHeight: '100vh', width: '100vw', overflow: 'hidden',
        background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={{ width: 'min(92vw, 440px)' }}>
        <div style={{ background:'rgba(255,255,255,.06)', borderRadius:12, padding:16, marginBottom:12 }}>
          <ShipSelect onPurchased={() => setRefresh((x) => x + 1)} />
        </div>
        <div style={{ position:'relative', width:'min(92vw, 440px)', paddingTop:'133.333%', borderRadius:12, overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0 }}>
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
