'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import {
  CAMPAIGN_FACTORY,
  DEFAULT_CAMPAIGN,
  getLocalCampaigns,
  isValidAddress,
  type CampaignRecord,
} from '@/lib/campaigns';

const CAMPAIGN_CREATED_EVENT = parseAbiItem(
  'event CampaignCreated(address indexed campaign, address indexed operator, address indexed token, string name, uint256 jatahPerPenerima, uint256 maxPerTx, uint256 maxPerHari)'
);

const LOG_WINDOWS = [9_500n, 2_000n];

function buildBaseList(): CampaignRecord[] {
  const map = new Map<string, CampaignRecord>();
  if (isValidAddress(DEFAULT_CAMPAIGN)) {
    map.set(DEFAULT_CAMPAIGN.toLowerCase(), {
      address: DEFAULT_CAMPAIGN,
      isDefault: true,
    });
  }
  for (const local of getLocalCampaigns()) {
    const k = local.address.toLowerCase();
    if (!map.has(k)) {
      map.set(k, local);
    } else {
      map.set(k, { ...map.get(k)!, ...local });
    }
  }
  return Array.from(map.values());
}

export function useCampaignList() {
  const publicClient = usePublicClient();
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(() => buildBaseList());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    const merged = new Map<string, CampaignRecord>();
    for (const c of buildBaseList()) {
      merged.set(c.address.toLowerCase(), c);
    }

    if (!publicClient || !isValidAddress(CAMPAIGN_FACTORY)) {
      setCampaigns(Array.from(merged.values()));
      return;
    }

    setIsLoading(true);
    try {
      const latest = await publicClient.getBlockNumber();
      let logs = null;
      let lastErr: unknown = null;

      for (const windowSize of LOG_WINDOWS) {
        const fromBlock = latest > windowSize ? latest - windowSize : 0n;
        try {
          logs = await publicClient.getLogs({
            address: CAMPAIGN_FACTORY,
            event: CAMPAIGN_CREATED_EVENT,
            fromBlock,
            toBlock: 'latest',
          });
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!logs) throw lastErr;

      for (const log of logs) {
        const addr = log.args.campaign;
        if (!addr || !isValidAddress(addr)) continue;
        const k = addr.toLowerCase();
        const existing = merged.get(k);
        merged.set(k, {
          ...existing,
          address: addr,
          name: log.args.name || existing?.name,
          operator: log.args.operator || existing?.operator,
        });
      }
    } catch {
      setError('Gagal membaca log CampaignFactory dari RPC Sepolia. Menampilkan kampanye tersimpan.');
    } finally {
      setCampaigns(Array.from(merged.values()));
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { campaigns, isLoading, error, refresh };
}
