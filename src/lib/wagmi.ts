'use client';

import { createConfig, http } from 'wagmi';
import { base } from '@/lib/chains';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

export const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [farcasterMiniApp()] as any,
});
