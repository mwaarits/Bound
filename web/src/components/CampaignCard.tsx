'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useReadContract } from 'wagmi';
import { campaignAbi, mockIDRXAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';
import { useCampaignMeta } from '@/lib/campaign-meta';
import {
  MOCKIDRX_ADDRESS,
  isValidAddress,
  shortenAddress,
  type CampaignRecord,
} from '@/lib/campaigns';

export function CampaignCard({ campaign }: { campaign: CampaignRecord }) {
  const addr = campaign.address;
  const [meta] = useCampaignMeta(addr);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [addr, meta.imageUrl]);

  const title =
    campaign.name && meta.title === 'Banjir Demak 2025' && !campaign.isDefault
      ? campaign.name
      : meta.title;

  const valid = isValidAddress(addr) && isValidAddress(MOCKIDRX_ADDRESS);

  const { data: pool, isLoading: poolLoading } = useReadContract({
    address: MOCKIDRX_ADDRESS,
    abi: mockIDRXAbi,
    functionName: 'balanceOf',
    args: [addr],
    query: { enabled: valid },
  });

  const { data: jatah } = useReadContract({
    address: addr,
    abi: campaignAbi,
    functionName: 'jatahPerPenerima',
    query: { enabled: isValidAddress(addr) },
  });

  const targetNum =
    Number(meta.target) > 0
      ? BigInt(Math.floor(Number(meta.target))) * 10n ** 18n
      : 50_000_000n * 10n ** 18n;
  const poolNum = (pool as bigint) ?? 0n;
  const progress = targetNum > 0n ? Math.min(100, Number((poolNum * 100n) / targetNum)) : 0;
  const hasImage = Boolean(meta.imageUrl && meta.imageUrl.trim() && !imgError);

  return (
    <article className="animate-enter w-full max-w-[360px] h-full rounded-lg bg-bg-base border border-border-subtle shadow-xs hover:border-brand-primary/60 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between">
      <div className="min-w-0">
        <div className="relative h-48 w-full shrink-0 bg-bg-surface border-b border-border-subtle overflow-hidden">
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={meta.imageUrl}
              alt={`Foto kampanye ${title}`}
              width={360}
              height={192}
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-text-secondary px-4 text-center">
              <svg
                className="w-8 h-8 text-border-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="M21 16l-5-5-4 4-2-2-7 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-caption text-text-secondary">
                Belum ada foto kampanye
              </span>
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h3 font-semibold text-text-primary">{title}</h3>
                <span className="rounded-full bg-brand-surface text-brand-primary text-caption font-medium px-2.5 py-0.5">
                  Aktif
                </span>
              </div>
              <p className="font-mono text-caption text-text-secondary">
                {shortenAddress(addr, 8, 6)}
              </p>
            </div>
          </div>

          <p className="text-body-sm text-text-secondary line-clamp-2">{meta.description}</p>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-numeric-ledger text-h3 text-text-primary">
                {poolLoading ? 'Memuat...' : formatIDR(poolNum)}
              </span>
              <span className="text-caption text-text-secondary">
                dari {formatIDR(targetNum)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-border-subtle overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-caption text-text-secondary">
              <span>{progress}% terkumpul</span>
              <span>
                Jatah:{' '}
                <strong className="font-mono text-text-primary">
                  {jatah ? formatIDR(jatah as bigint) : '...'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 px-6 pb-6 pt-3 border-t border-border-subtle">
        <Link
          href={`/campaign/${addr}`}
          className="min-h-[42px] px-3 rounded-default border border-border-subtle bg-bg-surface text-text-primary text-body-sm font-medium flex items-center justify-center hover:border-brand-primary transition-colors"
        >
          Lihat Detail
        </Link>
        <Link
          href={`/campaign/${addr}/donate`}
          className="min-h-[42px] px-3 rounded-default bg-brand-primary text-text-on-dark text-body-sm font-semibold flex items-center justify-center hover:bg-brand-primary-deep transition-colors"
        >
          Donasi
        </Link>
      </div>
    </article>
  );
}
