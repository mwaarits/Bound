import { ethers } from 'ethers';
import type { Config } from '../config.js';
import { CampaignAbi } from '../abi/Campaign.abi.js';
import { CampaignFactoryAbi } from '../abi/CampaignFactory.abi.js';
import { MockIDRXAbi } from '../abi/MockIDRX.abi.js';

export function createContracts(config: Config, signer?: ethers.Signer) {
  const provider = new ethers.JsonRpcProvider(config.RPC_URL);
  const s = signer ?? new ethers.JsonRpcProvider(config.RPC_URL);
  return {
    mockIDRX: new ethers.Contract(config.MOCKIDRX_ADDRESS, MockIDRXAbi, s),
    campaign: new ethers.Contract(config.CAMPAIGN_ADDRESS, CampaignAbi, s),
    campaignFactory: new ethers.Contract(config.CAMPAIGN_FACTORY_ADDRESS, CampaignFactoryAbi, s),
    provider,
  };
}
