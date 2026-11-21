'use client';

import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// ponytail: skip wagmi/connectors barrel (pulls in Coinbase SDK deps that
// break Next.js build). wagmi v2 auto-detects injected providers (MetaMask).
export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  multiInjectedProviderDiscovery: true,
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});