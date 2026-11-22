'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { isValidAddress } from '@/lib/campaigns';

const DONASI_EVENT = parseAbiItem('event Donasi(address indexed donatur, uint256 jumlah)');
const BELANJA_EVENT = parseAbiItem(
  'event Belanja(address indexed penerima, address indexed toko, uint256 jumlah, uint256 nonce)'
);
const WHITELIST_EVENT = parseAbiItem(
  'event WhitelistDiubah(address indexed toko, bool diizinkan)'
);
const PENERIMA_EVENT = parseAbiItem(
  'event PenerimaDiubah(address indexed penerima, bool diizinkan)'
);

export type CampaignActivityItem =
  | {
      id: string;
      type: 'donasi';
      donatur: `0x${string}`;
      jumlah: bigint;
      blockNumber: bigint;
      txHash: `0x${string}`;
    }
  | {
      id: string;
      type: 'belanja';
      penerima: `0x${string}`;
      toko: `0x${string}`;
      jumlah: bigint;
      nonce: bigint;
      blockNumber: bigint;
      txHash: `0x${string}`;
    }
  | {
      id: string;
      type: 'whitelist';
      toko: `0x${string}`;
      diizinkan: boolean;
      blockNumber: bigint;
      txHash: `0x${string}`;
    };

export type WhitelistEntry = {
  addr: `0x${string}`;
  active: boolean;
};

export type RecipientEntry = {
  addr: `0x${string}`;
  active: boolean;
};

const LOG_WINDOWS = [9_500n, 2_000n];

export function useCampaignEvents(campaignAddr: string) {
  const publicClient = usePublicClient();
  const [events, setEvents] = useState<CampaignActivityItem[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [recipients, setRecipients] = useState<RecipientEntry[]>([]);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!publicClient || !isValidAddress(campaignAddr)) return;

    setIsLoading(true);
    setError(null);
    try {
      const latest = await publicClient.getBlockNumber();
      const fetchWindow = (fromBlock: bigint) =>
        Promise.all([
          publicClient.getLogs({
            address: campaignAddr,
            event: DONASI_EVENT,
            fromBlock,
            toBlock: 'latest',
          }),
          publicClient.getLogs({
            address: campaignAddr,
            event: BELANJA_EVENT,
            fromBlock,
            toBlock: 'latest',
          }),
          publicClient.getLogs({
            address: campaignAddr,
            event: WHITELIST_EVENT,
            fromBlock,
            toBlock: 'latest',
          }),
          publicClient.getLogs({
            address: campaignAddr,
            event: PENERIMA_EVENT,
            fromBlock,
            toBlock: 'latest',
          }),
        ]);

      let fetched: Awaited<ReturnType<typeof fetchWindow>> | null = null;
      let lastErr: unknown = null;

      for (const windowSize of LOG_WINDOWS) {
        const fromBlock = latest > windowSize ? latest - windowSize : 0n;
        try {
          fetched = await fetchWindow(fromBlock);
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!fetched) throw lastErr;
      const [donasiLogs, belanjaLogs, whitelistLogs, penerimaLogs] = fetched;

      const combined: CampaignActivityItem[] = [];

      for (const l of donasiLogs) {
        if (!l.args.donatur || l.args.jumlah === undefined || !l.transactionHash) continue;
        combined.push({
          id: `${l.transactionHash}-${l.logIndex}`,
          type: 'donasi',
          donatur: l.args.donatur,
          jumlah: l.args.jumlah,
          blockNumber: l.blockNumber ?? 0n,
          txHash: l.transactionHash,
        });
      }

      for (const l of belanjaLogs) {
        if (!l.args.penerima || !l.args.toko || l.args.jumlah === undefined || !l.transactionHash)
          continue;
        combined.push({
          id: `${l.transactionHash}-${l.logIndex}`,
          type: 'belanja',
          penerima: l.args.penerima,
          toko: l.args.toko,
          jumlah: l.args.jumlah,
          nonce: l.args.nonce ?? 0n,
          blockNumber: l.blockNumber ?? 0n,
          txHash: l.transactionHash,
        });
      }

      const wlMap = new Map<string, WhitelistEntry>();
      for (const l of whitelistLogs) {
        if (!l.args.toko || l.args.diizinkan === undefined || !l.transactionHash) continue;
        wlMap.set(l.args.toko.toLowerCase(), {
          addr: l.args.toko,
          active: l.args.diizinkan,
        });
        combined.push({
          id: `${l.transactionHash}-${l.logIndex}`,
          type: 'whitelist',
          toko: l.args.toko,
          diizinkan: l.args.diizinkan,
          blockNumber: l.blockNumber ?? 0n,
          txHash: l.transactionHash,
        });
      }

      const recMap = new Map<string, RecipientEntry>();
      for (const l of penerimaLogs) {
        if (!l.args.penerima || l.args.diizinkan === undefined) continue;
        recMap.set(l.args.penerima.toLowerCase(), {
          addr: l.args.penerima,
          active: l.args.diizinkan,
        });
      }

      combined.sort((a, b) => (b.blockNumber > a.blockNumber ? 1 : b.blockNumber < a.blockNumber ? -1 : 0));

      const recList = Array.from(recMap.values());
      setEvents(combined);
      setWhitelist(Array.from(wlMap.values()));
      setRecipients(recList);
      setRecipientCount(recList.filter((r) => r.active).length);
    } catch {
      setError('Gagal memuat log event dari RPC Sepolia. Klik Segarkan untuk mencoba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, campaignAddr]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { events, whitelist, recipients, recipientCount, isLoading, error, refetch };
}
