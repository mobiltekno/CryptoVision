// src/lib/wagmi-miniapp.ts
'use client';
import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { sdk } from '@farcaster/miniapp-sdk';
import { custom } from 'viem';

// Farcaster mini app cüzdan sağlayıcısı (EIP-1193)
const provider = sdk.wallet.ethProvider ?? window.ethereum;

// Wagmi config’i: Base ana ağ (oyun ödemeleri için Base kullanıyorsun)
export const wagmiConfig = createConfig({
  chains: [base],
  transports: { [base.id]: provider ? custom(provider) : http() },
  // injected connector’a ihtiyaç yok; provider direkt veriliyor
});
