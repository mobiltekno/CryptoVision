'use client';
import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import { STORE_ABI, STORE_ADDR } from '@/lib/contract';

type Row = { addr: string; score: bigint };

export function Leaderboard() {
  const { data } = useReadContract({
    address: STORE_ADDR,
    abi: STORE_ABI,
    functionName: 'getLeaderboard',
  });

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!data) return;
    const [addrsRO, scoresRO] = data as readonly [
      readonly `0x${string}`[],
      readonly bigint[]
    ];
    const addrs = Array.from(addrsRO);
    const scores = Array.from(scoresRO);
    const arr: Row[] = addrs
      .map((a, i) => ({ addr: a as string, score: scores[i] ?? 0n }))
      .filter(
        (r) =>
          r.addr !== '0x0000000000000000000000000000000000000000' && r.score > 0n
      );
    setRows(arr);
  }, [data]);

  return (
    <div className="p-3 rounded-2xl bg-white/5">
      <div className="font-semibold mb-2">Liderlik Tablosu (Top 20)</div>
      <ol className="space-y-1">
        {rows.map((r, i) => (
          <li key={i} className="text-sm opacity-90">
            {i + 1}. {r.addr.slice(0, 6)}…{r.addr.slice(-4)} — {r.score.toString()} puan
          </li>
        ))}
        {rows.length === 0 && (
          <div className="text-sm opacity-60">Henüz skor yok.</div>
        )}
      </ol>
    </div>
  );
}
export default Leaderboard;
