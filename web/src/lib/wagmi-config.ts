'use client';

import { createConfig, http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

// Deployed on Ethereum Sepolia (chain ID 11155111) — not Base Sepolia.
// MetaMask was on Ethereum Sepolia during Remix deploy; contracts work identically.
export const wagmiConfig = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: true,
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },
});