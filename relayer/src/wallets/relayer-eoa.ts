import { ethers } from 'ethers';

export function loadRelayerEOA(privateKey: string, rpcUrl: string): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}
