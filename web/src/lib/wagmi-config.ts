'use client';

import { createConfig, http, injected } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

// Deployed on Ethereum Sepolia (chain ID 11155111).
// Configured strictly for MetaMask browser extension.
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected({ target: 'metaMask' })],
  multiInjectedProviderDiscovery: false,
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
});
