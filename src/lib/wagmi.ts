import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected({ shimDisconnect: true }), // Farcaster in-app wallet genelde injected üstünden görünüyor
  ],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL as string),
  },
});
