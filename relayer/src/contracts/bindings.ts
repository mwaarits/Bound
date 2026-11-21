import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ethers } from 'ethers';
import type { Config } from '../config.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function loadAbi(name: string): ethers.InterfaceAbi {
  const base = `${__dirname}../../../contracts/out/${name}.sol/${name}.json`;
  return JSON.parse(readFileSync(base, 'utf-8')).abi;
}

export function createContracts(config: Config, signer?: ethers.Signer) {
  const provider = new ethers.JsonRpcProvider(config.RPC_URL);
  const s = signer ?? new ethers.JsonRpcProvider(config.RPC_URL);
  return {
    mockIDRX: new ethers.Contract(config.MOCKIDRX_ADDRESS, loadAbi('MockIDRX'), s),
    campaign: new ethers.Contract(config.CAMPAIGN_ADDRESS, loadAbi('Campaign'), s),
    campaignFactory: new ethers.Contract(config.CAMPAIGN_FACTORY_ADDRESS, loadAbi('CampaignFactory'), s),
    provider,
  };
}
