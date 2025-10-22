'use client';
import { useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';

export function Connect() {
  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();

  // Sadece Farcaster connector’ını seç
  const fc = connectors.find(
    (c) =>
      (c.id ?? '').toLowerCase().includes('farcaster') ||
      (c.name ?? '').toLowerCase().includes('farcaster')
  );

  // Sayfa yüklendiğinde otomatik bağlan
  useEffect(() => {
    if (!isConnected && fc && fc.ready) {
      connect({ connector: fc });
    }
  }, [isConnected, fc, connect]);

  // Artık hiçbir buton veya yazı göstermiyoruz
  if (isConnected)
    return <div className="text-xs opacity-70">Bağlı: {address}</div>;

  return null;
}
export default Connect;
