'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { relayerPost } from '@/lib/relayer-client';
import { campaignAbi, mockIDRXAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';
import {
  compressImageFile,
  getCampaignMeta,
  setCampaignMeta,
  type CampaignMeta,
} from '@/lib/campaign-meta';
import {
  DEFAULT_CAMPAIGN,
  MOCKIDRX_ADDRESS,
  etherscanAddrUrl,
  etherscanTxUrl,
  getRecipientLabels,
  isValidAddress,
  saveRecipientLabels,
  shortenAddress,
  type RecipientLabel,
} from '@/lib/campaigns';
import {
  useCampaignEvents,
  type RecipientEntry,
  type WhitelistEntry,
} from '@/hooks/useCampaignEvents';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default function CampaignDashboard({ params }: { params: { addr: string } }) {
  const campaignAddr = (isValidAddress(params.addr)
    ? params.addr
    : DEFAULT_CAMPAIGN) as `0x${string}`;
  const [view, setView] = useState<'public' | 'operator'>('public');
  const [metaVersion, setMetaVersion] = useState(0);

  const { address, isConnected } = useAccount();
  const { data: ownerData, isLoading: ownerLoading } = useReadContract({
    address: campaignAddr,
    abi: campaignAbi,
    functionName: 'owner',
  });
  const ownerAddr = ownerData as `0x${string}` | undefined;
  const isOperator = Boolean(
    isConnected && address && ownerAddr && address.toLowerCase() === ownerAddr.toLowerCase()
  );
  const canShowOperatorTab = !isConnected || ownerLoading || isOperator;

  useEffect(() => {
    if (isConnected && !ownerLoading && ownerAddr && !isOperator && view === 'operator') {
      setView('public');
    }
  }, [isConnected, ownerLoading, ownerAddr, isOperator, view]);

  const meta = getCampaignMeta(campaignAddr);
  const {
    events,
    whitelist,
    recipients: onChainRecipients,
    recipientCount,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useCampaignEvents(campaignAddr);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-body-sm text-text-secondary flex-wrap">
          <Link href="/campaigns" className="hover:text-brand-primary font-medium">
            ← Semua Kampanye
          </Link>
          <span>/</span>
          <span className="font-mono text-caption text-text-primary">
            {shortenAddress(campaignAddr, 8, 6)}
          </span>
          <a
            href={etherscanAddrUrl(campaignAddr)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-caption text-brand-primary hover:underline"
          >
            Etherscan ↗
          </a>
        </div>

        <Link
          href={`/campaign/${campaignAddr}/donate`}
          className="inline-flex items-center justify-center min-h-[42px] px-5 rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body-sm font-semibold transition-colors"
        >
          Donasi ke Kampanye Ini
        </Link>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <button
          type="button"
          onClick={() => setView('public')}
          className={`px-4 py-2 rounded-default text-body-sm font-semibold transition-colors ${
            view === 'public'
              ? 'bg-brand-primary text-text-on-dark'
              : 'bg-bg-surface text-text-secondary hover:text-text-primary'
          }`}
        >
          Tampilan Publik
        </button>
        {canShowOperatorTab && (
          <button
            type="button"
            onClick={() => setView('operator')}
            className={`px-4 py-2 rounded-default text-body-sm font-semibold transition-colors ${
              view === 'operator'
                ? 'bg-brand-primary text-text-on-dark'
                : 'bg-bg-surface text-text-secondary hover:text-text-primary'
            }`}
          >
            Panel Operator
          </button>
        )}
      </div>

      {view === 'public' ? (
        <PublicView
          key={metaVersion}
          campaignAddr={campaignAddr}
          meta={meta}
          events={events}
          whitelist={whitelist}
          recipientCount={recipientCount}
          eventsLoading={eventsLoading}
          eventsError={eventsError}
          onRefreshEvents={refetchEvents}
        />
      ) : (
        <OperatorView
          campaignAddr={campaignAddr}
          ownerAddr={ownerAddr}
          ownerLoading={ownerLoading}
          initialWhitelist={whitelist}
          initialRecipients={onChainRecipients}
          onMetaSaved={() => setMetaVersion((v) => v + 1)}
          onChainMutated={refetchEvents}
          onBackToPublic={() => setView('public')}
        />
      )}
    </main>
  );
}

function PublicView({
  campaignAddr,
  meta,
  events,
  whitelist,
  recipientCount,
  eventsLoading,
  eventsError,
  onRefreshEvents,
}: {
  campaignAddr: `0x${string}`;
  meta: CampaignMeta;
  events: ReturnType<typeof useCampaignEvents>['events'];
  whitelist: WhitelistEntry[];
  recipientCount: number | null;
  eventsLoading: boolean;
  eventsError: string | null;
  onRefreshEvents: () => Promise<void>;
}) {
  const validToken = isValidAddress(MOCKIDRX_ADDRESS);

  const { data: pool, isLoading: poolLoading } = useReadContract({
    address: MOCKIDRX_ADDRESS,
    abi: mockIDRXAbi,
    functionName: 'balanceOf',
    args: [campaignAddr],
    query: { enabled: validToken },
  });
  const { data: jatah } = useReadContract({
    address: campaignAddr,
    abi: campaignAbi,
    functionName: 'jatahPerPenerima',
  });
  const { data: maxPerTx } = useReadContract({
    address: campaignAddr,
    abi: campaignAbi,
    functionName: 'maxPerTx',
  });
  const { data: maxPerHari } = useReadContract({
    address: campaignAddr,
    abi: campaignAbi,
    functionName: 'maxPerHari',
  });

  const targetNum =
    Number(meta.target) > 0
      ? BigInt(Math.floor(Number(meta.target))) * 10n ** 18n
      : 50_000_000n * 10n ** 18n;
  const poolNum = (pool as bigint) ?? 0n;
  const progress = targetNum > 0n ? Math.min(100, Number((poolNum * 100n) / targetNum)) : 0;
  const activeStoresCount = whitelist.filter((w) => w.active).length;

  return (
    <div className="space-y-6">
      {/* Campaign Cover, Title & Description */}
      <section className="rounded-lg bg-bg-surface border border-border-subtle shadow-xs overflow-hidden">
        {meta.imageUrl && meta.imageUrl.trim() && (
          <div className="relative h-56 sm:h-72 w-full shrink-0 bg-bg-base border-b border-border-subtle overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={meta.imageUrl}
              alt={`Foto kampanye ${meta.title}`}
              width={896}
              height={288}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
          </div>
        )}
        <div className="p-6 space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-h1 font-bold text-text-primary">{meta.title}</h1>
            <span className="rounded-full bg-brand-surface text-brand-primary text-caption font-medium px-2.5 py-0.5">
              Aktif
            </span>
          </div>
          <p className="text-body text-text-secondary leading-relaxed">{meta.description}</p>
        </div>
      </section>

      {/* Pool Progress Card */}
      <section className="rounded-lg bg-bg-base p-6 border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-body-sm font-medium text-text-secondary">Kolam Kampanye</p>
          <span className="text-caption font-mono text-brand-primary font-semibold">
            {progress}% tercapai
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span className="text-numeric-ledger text-text-primary text-h1">
            {poolLoading ? 'Memuat...' : formatIDR(poolNum)}
          </span>
          <span className="text-body-sm text-text-secondary">Target {formatIDR(targetNum)}</span>
        </div>
        <div className="h-2.5 rounded-full bg-border-subtle overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-caption text-text-secondary">
          Terkumpul / Target • Dibaca langsung dari saldo mIDRX kontrak kampanye
        </p>
      </section>

      {/* On-Chain Rules & Counts */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-bg-surface p-4 border border-border-subtle">
          <p className="text-caption text-text-secondary">Jatah per Penerima</p>
          <p className="text-numeric-ledger text-text-primary mt-1">
            {jatah ? formatIDR(jatah as bigint) : '...'}
          </p>
        </div>
        <div className="rounded-lg bg-bg-surface p-4 border border-border-subtle">
          <p className="text-caption text-text-secondary">Maks / Transaksi</p>
          <p className="text-numeric-ledger text-text-primary mt-1">
            {maxPerTx ? formatIDR(maxPerTx as bigint) : '...'}
          </p>
        </div>
        <div className="rounded-lg bg-bg-surface p-4 border border-border-subtle">
          <p className="text-caption text-text-secondary">Maks / Hari</p>
          <p className="text-numeric-ledger text-text-primary mt-1">
            {maxPerHari ? formatIDR(maxPerHari as bigint) : '...'}
          </p>
        </div>
        <div className="rounded-lg bg-bg-surface p-4 border border-border-subtle">
          <p className="text-caption text-text-secondary">Penerima & Toko</p>
          <p className="text-numeric-ledger text-text-primary mt-1">
            {recipientCount ?? 0} orang • {activeStoresCount} toko
          </p>
        </div>
      </section>

      {/* Live On-Chain Events Feed */}
      <section className="rounded-lg bg-bg-base p-6 border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary">Riwayat Transaksi On-Chain</h2>
            <p className="text-caption text-text-secondary">
              Event Donasi, Belanja, dan Whitelist terbaru dari Ethereum Sepolia
            </p>
          </div>
          <button
            type="button"
            onClick={() => void onRefreshEvents()}
            disabled={eventsLoading}
            className="px-3 py-1.5 rounded-default border border-border-subtle bg-bg-surface text-caption font-medium text-text-primary hover:border-brand-primary"
          >
            {eventsLoading ? 'Memuat...' : 'Segarkan'}
          </button>
        </div>

        {eventsError && (
          <div
            role="alert"
            className="rounded-default border border-error/25 bg-error/5 px-4 py-3 text-body-sm text-error flex items-center justify-between gap-3"
          >
            <span>{eventsError}</span>
            <button
              type="button"
              onClick={() => void onRefreshEvents()}
              className="underline font-semibold shrink-0"
            >
              Coba lagi
            </button>
          </div>
        )}

        {events.length === 0 ? (
          <div className="rounded-default bg-bg-surface border border-border-subtle p-4 text-body-sm text-text-secondary">
            {eventsLoading
              ? 'Membaca log blockchain Sepolia...'
              : 'Belum ada event transaksi terbaru pada rentang blok terakhir. Saldo kolam saat ini: ' +
                formatIDR(poolNum) +
                '.'}
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {events.slice(0, 20).map((ev) => (
              <div
                key={ev.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                      ev.type === 'donasi'
                        ? 'bg-brand-primary'
                        : ev.type === 'belanja'
                          ? 'bg-success'
                          : 'bg-text-secondary'
                    }`}
                  />
                  <div className="space-y-0.5">
                    {ev.type === 'donasi' && (
                      <>
                        <p className="text-body-sm font-semibold text-text-primary">Donasi Masuk</p>
                        <p className="text-caption text-text-secondary font-mono">
                          Dari {shortenAddress(ev.donatur)}
                        </p>
                      </>
                    )}
                    {ev.type === 'belanja' && (
                      <>
                        <p className="text-body-sm font-semibold text-text-primary">
                          Belanja di Toko Whitelist
                        </p>
                        <p className="text-caption text-text-secondary font-mono">
                          {shortenAddress(ev.penerima)} → {shortenAddress(ev.toko)}
                        </p>
                      </>
                    )}
                    {ev.type === 'whitelist' && (
                      <>
                        <p className="text-body-sm font-semibold text-text-primary">
                          {ev.diizinkan ? 'Toko Ditambahkan ke Whitelist' : 'Toko Dihapus dari Whitelist'}
                        </p>
                        <p className="text-caption text-text-secondary font-mono">
                          Toko {shortenAddress(ev.toko)}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pl-5 sm:pl-0">
                  {ev.type === 'donasi' && (
                    <span className="text-numeric-ledger text-body-sm text-brand-primary font-semibold">
                      +{formatIDR(ev.jumlah)}
                    </span>
                  )}
                  {ev.type === 'belanja' && (
                    <span className="text-numeric-ledger text-body-sm text-success-text font-semibold">
                      -{formatIDR(ev.jumlah)}
                    </span>
                  )}
                  <a
                    href={etherscanTxUrl(ev.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption text-brand-primary hover:underline shrink-0"
                  >
                    Tx ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function extractWalletError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const e = err as { shortMessage?: string; message?: string };
    const raw = e.shortMessage || e.message || '';
    if (raw.toLowerCase().includes('user rejected')) return 'Transaksi dibatalkan di MetaMask.';
    if (raw.toLowerCase().includes('insufficient funds'))
      return 'Saldo Sepolia ETH tidak cukup untuk membayar gas fee.';
    if (raw.includes('OwnableUnauthorizedAccount'))
      return 'Dompet yang terhubung bukan pemilik (owner) kontrak kampanye ini.';
    if (raw) return `${fallback} (${raw.slice(0, 140)})`;
  }
  return fallback;
}

type OperatorToast = {
  id: number;
  kind: 'loading' | 'success' | 'error';
  message: string;
  txHash?: string;
};

function OperatorView({
  campaignAddr,
  ownerAddr,
  ownerLoading,
  initialWhitelist,
  initialRecipients,
  onMetaSaved,
  onChainMutated,
  onBackToPublic,
}: {
  campaignAddr: `0x${string}`;
  ownerAddr: `0x${string}` | undefined;
  ownerLoading: boolean;
  initialWhitelist: WhitelistEntry[];
  initialRecipients: RecipientEntry[];
  onMetaSaved: () => void;
  onChainMutated: () => Promise<void>;
  onBackToPublic: () => void;
}) {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const publicClient = usePublicClient();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const isWrongNetwork = isConnected && walletChainId !== sepolia.id;
  const { data: currentAgent, refetch: refetchAgent } = useReadContract({
    address: campaignAddr,
    abi: campaignAbi,
    functionName: 'agent',
  });

  const [meta, setMeta] = useState<CampaignMeta>(() => getCampaignMeta(campaignAddr));
  const [agentAddr, setAgentAddr] = useState('');
  const [agentBusy, setAgentBusy] = useState(false);
  const [storeAddr, setStoreAddr] = useState('');
  const [recipients, setRecipients] = useState('');
  const [toast, setToast] = useState<OperatorToast | null>(null);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>(initialWhitelist);
  const [recipientList, setRecipientList] = useState<RecipientEntry[]>(initialRecipients);
  const [recipientLabels, setRecipientLabels] = useState<Record<string, RecipientLabel>>(() =>
    getRecipientLabels(campaignAddr)
  );

  useEffect(() => {
    setWhitelist((prev) => {
      const map = new Map<string, WhitelistEntry>();
      for (const s of prev) map.set(s.addr.toLowerCase(), s);
      for (const s of initialWhitelist) map.set(s.addr.toLowerCase(), s);
      return Array.from(map.values());
    });
  }, [initialWhitelist]);

  useEffect(() => {
    setRecipientList((prev) => {
      const map = new Map<string, RecipientEntry>();
      for (const r of prev) map.set(r.addr.toLowerCase(), r);
      for (const r of initialRecipients) map.set(r.addr.toLowerCase(), r);
      return Array.from(map.values());
    });
  }, [initialRecipients]);

  useEffect(() => {
    if (!toast || toast.kind === 'loading') return;
    const duration = toast.txHash ? 6500 : 4500;
    const timer = setTimeout(() => {
      setToast((prev) => (prev?.id === toast.id ? null : prev));
    }, duration);
    return () => clearTimeout(timer);
  }, [toast]);

  function notify(kind: OperatorToast['kind'], message: string, txHash?: string) {
    setToast({ id: Date.now() + Math.random(), kind, message, txHash });
  }

  if (!isConnected || !address) {
    return (
      <section className="rounded-lg bg-bg-surface border border-border-subtle p-8 text-center space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-h3 font-semibold text-text-primary">
            Hubungkan MetaMask untuk Panel Operator
          </h2>
          <p className="text-body-sm text-text-secondary max-w-md mx-auto">
            Hanya dompet Bound Operator (pemilik kontrak kampanye) yang dapat mengakses panel ini.
          </p>
        </div>
        <div className="flex justify-center">
          <ConnectWalletButton variant="primary" />
        </div>
      </section>
    );
  }

  if (ownerLoading) {
    return (
      <section className="rounded-lg bg-bg-surface border border-border-subtle p-8 text-center">
        <p className="text-body-sm text-text-secondary">
          Memverifikasi hak akses Bound Operator di blockchain...
        </p>
      </section>
    );
  }

  const isOwner = Boolean(ownerAddr && ownerAddr.toLowerCase() === address.toLowerCase());

  if (!isOwner) {
    return (
      <section className="rounded-lg bg-bg-surface border border-error/25 p-8 text-center space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-h3 font-semibold text-error">
            Akses Ditolak (Khusus Bound Operator)
          </h2>
          <p className="text-body-sm text-text-secondary max-w-md mx-auto">
            Akun terhubung (<span className="font-mono">{shortenAddress(address)}</span>) bukan
            pemilik kontrak kampanye ini. Operator resmi:{' '}
            <span className="font-mono">{ownerAddr ? shortenAddress(ownerAddr) : 'tidak diketahui'}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={onBackToPublic}
          className="min-h-[44px] px-5 rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body-sm font-semibold"
        >
          Kembali ke Tampilan Publik
        </button>
      </section>
    );
  }

  const agentOnChain = currentAgent as `0x${string}` | undefined;
  const hasAgent = Boolean(
    agentOnChain && agentOnChain.toLowerCase() !== '0x0000000000000000000000000000000000000000'
  );

  function saveMeta() {
    try {
      setCampaignMeta(campaignAddr, meta);
      onMetaSaved();
      notify('success', 'Metadata dan foto kampanye disimpan di browser ini.');
    } catch {
      notify('error', 'Ukuran gambar terlalu besar untuk disimpan. Coba gambar lain atau gunakan URL.');
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file);
      setMeta((prev) => ({ ...prev, imageUrl: dataUrl }));
      notify('success', 'Foto siap. Klik Simpan Metadata untuk menerapkan perubahan.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Gagal memproses file gambar.');
    } finally {
      e.target.value = '';
    }
  }

  async function saveAgent() {
    const trimmed = agentAddr.trim();
    if (!isValidAddress(trimmed)) {
      notify('error', 'Masukkan alamat dompet Bound Relayer yang valid (0x...).');
      return;
    }
    if (isWrongNetwork) {
      notify('error', 'MetaMask bukan di jaringan Sepolia. Klik "Ganti ke Jaringan Sepolia" dulu.');
      return;
    }
    setAgentBusy(true);
    notify('loading', 'Menunggu konfirmasi MetaMask untuk mengatur alamat Relayer (setAgent)...');
    try {
      const tx = await writeContractAsync({
        chainId: sepolia.id,
        address: campaignAddr,
        abi: campaignAbi,
        functionName: 'setAgent',
        args: [trimmed],
      });
      notify('loading', 'Transaksi setAgent terkirim. Menunggu konfirmasi blok Sepolia...', tx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      notify('success', `Alamat Relayer (${shortenAddress(trimmed)}) berhasil didaftarkan sebagai agent.`, tx);
      setAgentAddr('');
      await refetchAgent();
    } catch (err) {
      notify('error', extractWalletError(err, 'Gagal mengatur Relayer.'));
    } finally {
      setAgentBusy(false);
    }
  }

  async function addStore() {
    const trimmed = storeAddr.trim();
    if (!isValidAddress(trimmed)) {
      notify('error', 'Masukkan alamat dompet toko yang valid (0x...).');
      return;
    }
    if (isWrongNetwork) {
      notify('error', 'MetaMask bukan di jaringan Sepolia. Klik "Ganti ke Jaringan Sepolia" dulu.');
      return;
    }
    notify('loading', 'Menunggu konfirmasi MetaMask untuk menambah toko...');
    try {
      const tx = await writeContractAsync({
        chainId: sepolia.id,
        address: campaignAddr,
        abi: campaignAbi,
        functionName: 'setWhitelist',
        args: [trimmed, true],
      });
      notify('loading', 'Transaksi terkirim. Menunggu konfirmasi blok Sepolia...', tx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      setWhitelist((prev) => {
        const rest = prev.filter((s) => s.addr.toLowerCase() !== trimmed.toLowerCase());
        return [{ addr: trimmed, active: true }, ...rest];
      });
      notify('success', `Toko ${shortenAddress(trimmed)} berhasil ditambahkan ke whitelist.`, tx);
      setStoreAddr('');
      void onChainMutated();
    } catch (err) {
      notify('error', extractWalletError(err, 'Gagal menambah toko.'));
    }
  }

  async function delistStore(addr: `0x${string}`) {
    if (isWrongNetwork) {
      notify('error', 'MetaMask bukan di jaringan Sepolia. Klik "Ganti ke Jaringan Sepolia" dulu.');
      return;
    }
    notify('loading', 'Menunggu konfirmasi MetaMask untuk menghapus toko...');
    try {
      const tx = await writeContractAsync({
        chainId: sepolia.id,
        address: campaignAddr,
        abi: campaignAbi,
        functionName: 'setWhitelist',
        args: [addr, false],
      });
      notify('loading', 'Menunggu konfirmasi blok Sepolia...', tx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      setWhitelist((prev) =>
        prev.map((s) => (s.addr.toLowerCase() === addr.toLowerCase() ? { ...s, active: false } : s))
      );
      notify('success', `Toko ${shortenAddress(addr)} dihapus dari whitelist.`, tx);
      void onChainMutated();
    } catch (err) {
      notify('error', extractWalletError(err, 'Gagal menghapus toko dari whitelist.'));
    }
  }

  async function registerRecipients() {
    const lines = recipients
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((l) => {
        const [nama, wa] = l.split(',');
        return { nama: (nama ?? '').trim(), wa: (wa ?? '').trim() };
      })
      .filter((r) => r.nama && r.wa);

    if (lines.length === 0) {
      notify('error', 'Isi minimal 1 penerima dengan format: Nama,+628...');
      return;
    }
    if (isWrongNetwork) {
      notify('error', 'MetaMask bukan di jaringan Sepolia. Klik "Ganti ke Jaringan Sepolia" dulu.');
      return;
    }

    notify('loading', '1/3 Membuat dompet kustodian penerima di relayer...');
    try {
      const res = await relayerPost<{
        recipients: { nama: string; wa: string; address: string }[];
      }>('/operator/recipients', { recipients: lines });
      const addrs = res.recipients.map((r) => r.address as `0x${string}`);
      notify('loading', `2/3 ${addrs.length} dompet siap. Konfirmasi setPenerimaBatch di MetaMask...`);
      const tx = await writeContractAsync({
        chainId: sepolia.id,
        address: campaignAddr,
        abi: campaignAbi,
        functionName: 'setPenerimaBatch',
        args: [addrs, addrs.map(() => true)],
      });
      notify('loading', '3/3 Transaksi terkirim. Menunggu konfirmasi blok Sepolia...', tx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      const updatedLabels = saveRecipientLabels(campaignAddr, res.recipients);
      setRecipientLabels(updatedLabels);
      setRecipientList((prev) => {
        const map = new Map<string, RecipientEntry>();
        for (const r of prev) map.set(r.addr.toLowerCase(), r);
        for (const a of addrs) map.set(a.toLowerCase(), { addr: a, active: true });
        return Array.from(map.values());
      });
      notify('success', `${addrs.length} penerima berhasil didaftarkan dan langsung tampil di daftar.`, tx);
      setRecipients('');
      void onChainMutated();
    } catch (err) {
      notify('error', extractWalletError(err, 'Pendaftaran penerima gagal. Pastikan relayer aktif.'));
    }
  }

  async function revokeRecipient(addr: `0x${string}`) {
    if (isWrongNetwork) {
      notify('error', 'MetaMask bukan di jaringan Sepolia. Klik "Ganti ke Jaringan Sepolia" dulu.');
      return;
    }
    notify('loading', 'Menunggu konfirmasi MetaMask untuk mencabut hak penerima...');
    try {
      const tx = await writeContractAsync({
        chainId: sepolia.id,
        address: campaignAddr,
        abi: campaignAbi,
        functionName: 'setPenerimaBatch',
        args: [[addr], [false]],
      });
      notify('loading', 'Menunggu konfirmasi blok Sepolia...', tx);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash: tx });
      }
      setRecipientList((prev) =>
        prev.map((r) => (r.addr.toLowerCase() === addr.toLowerCase() ? { ...r, active: false } : r))
      );
      notify('success', `Hak belanja penerima ${shortenAddress(addr)} dicabut.`, tx);
      void onChainMutated();
    } catch (err) {
      notify('error', extractWalletError(err, 'Gagal mencabut hak penerima.'));
    }
  }

  return (
    <div className="space-y-6">
      {isWrongNetwork && (
        <div className="rounded-lg bg-bg-surface-saffron border border-success/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-body-sm font-semibold text-success-text">
            MetaMask Anda bukan di jaringan Ethereum Sepolia. Pindah dulu agar tidak memakai ETH asli.
          </p>
          <button
            type="button"
            onClick={() => switchChain({ chainId: sepolia.id })}
            disabled={isSwitching}
            className="min-h-[42px] px-4 rounded-default bg-success text-text-primary text-body-sm font-bold shrink-0"
          >
            {isSwitching ? 'Mengganti...' : 'Ganti ke Jaringan Sepolia'}
          </button>
        </div>
      )}

      {/* Owner Verification Banner */}
      <div className="rounded-lg p-4 border bg-brand-surface border-brand-primary/30 text-brand-primary">
        <p className="text-body-sm font-semibold">✓ Operator Terverifikasi</p>
        <p className="text-caption">
          Anda terhubung sebagai pemilik kontrak ({shortenAddress(address)}).
        </p>
      </div>

      {/* Floating Auto-Dismiss Toast (always visible regardless of scroll position) */}
      {toast && (
        <div
          role={toast.kind === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`fixed bottom-5 right-4 sm:right-6 z-50 w-[calc(100%-2rem)] max-w-md rounded-lg border p-4 shadow-md flex items-start justify-between gap-3 ${
            toast.kind === 'error'
              ? 'bg-bg-base border-error/40 text-error'
              : toast.kind === 'loading'
                ? 'bg-chrome-dark border-white/15 text-text-on-dark'
                : 'bg-brand-surface border-brand-primary/40 text-brand-primary'
          }`}
        >
          <div className="space-y-1 min-w-0">
            <p className="text-body-sm font-medium break-words">{toast.message}</p>
            {toast.txHash && (
              <a
                href={etherscanTxUrl(toast.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-caption font-semibold underline"
              >
                Lihat transaksi di Sepolia Etherscan ↗
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="shrink-0 w-7 h-7 rounded-default flex items-center justify-center hover:bg-black/10 text-body font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Detail Kampanye */}
      <section className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-4">
        <h2 className="text-h3 font-semibold text-text-primary">Detail Kampanye</h2>
        <div className="space-y-3">
          <div>
            <label htmlFor="op-title" className="text-body-sm text-text-secondary mb-1 block">Judul Kampanye</label>
            <input
              id="op-title"
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.target.value })}
              className="w-full min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body"
            />
          </div>
          <div>
            <label htmlFor="op-desc" className="text-body-sm text-text-secondary mb-1 block">Deskripsi</label>
            <textarea
              id="op-desc"
              value={meta.description}
              onChange={(e) => setMeta({ ...meta, description: e.target.value })}
              className="w-full min-h-[80px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body"
            />
          </div>
          <div>
            <label htmlFor="op-target" className="text-body-sm text-text-secondary mb-1 block">Target Dana (IDR)</label>
            <input
              id="op-target"
              type="number"
              value={meta.target}
              onChange={(e) => setMeta({ ...meta, target: e.target.value })}
              className="w-full min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body font-mono"
            />
          </div>

          {/* Campaign Cover Image Editor */}
          <div className="space-y-2.5 pt-2 border-t border-border-subtle">
            <label htmlFor="op-image-url" className="text-body-sm font-medium text-text-primary block">
              Foto Kampanye
            </label>

            <div className="relative h-48 max-w-md w-full rounded-default bg-bg-base border border-border-subtle overflow-hidden flex items-center justify-center">
              {meta.imageUrl && meta.imageUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={meta.imageUrl}
                  alt={`Pratinjau foto ${meta.title}`}
                  width={448}
                  height={192}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <span className="text-caption text-text-secondary">Belum ada foto kampanye</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label
                htmlFor="op-image-file"
                className="min-h-[42px] px-4 rounded-default border border-border-subtle bg-bg-base hover:border-brand-primary text-body-sm font-medium text-text-primary inline-flex items-center cursor-pointer"
              >
                Upload Gambar
                <input
                  id="op-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => void handleImageUpload(e)}
                  className="sr-only"
                />
              </label>
              {meta.imageUrl && meta.imageUrl.trim() && (
                <button
                  type="button"
                  onClick={() => setMeta({ ...meta, imageUrl: '' })}
                  className="min-h-[42px] px-4 rounded-default border border-error/30 text-body-sm font-medium text-error hover:bg-error/5"
                >
                  Hapus Foto
                </button>
              )}
            </div>

            <input
              id="op-image-url"
              type="url"
              value={meta.imageUrl?.startsWith('data:') ? '' : (meta.imageUrl ?? '')}
              onChange={(e) => setMeta({ ...meta, imageUrl: e.target.value })}
              placeholder="Atau tempel URL gambar (https://...)"
              className="w-full min-h-[44px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2 text-body-sm"
            />
          </div>

          <button
            type="button"
            onClick={saveMeta}
            className="min-h-[44px] px-6 rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body-sm font-semibold"
          >
            Simpan Metadata
          </button>
        </div>
      </section>

      {/* Relayer / Agent Configuration */}
      <section className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-4">
        <div>
          <h2 className="text-h3 font-semibold text-text-primary">Relayer / Agent Kampanye</h2>
          <p className="text-body-sm text-text-secondary">
            Daftarkan alamat publik akun <strong>Bound Relayer</strong> agar backend dapat
            mengeksekusi belanja penerima secara gasless.
          </p>
        </div>

        <div className="rounded-default bg-bg-base border border-border-subtle p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-caption text-text-secondary">Agent Aktif On-Chain</span>
          {hasAgent && agentOnChain ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-body-sm font-medium text-text-primary">
                {shortenAddress(agentOnChain, 10, 6)}
              </span>
              <a
                href={etherscanAddrUrl(agentOnChain)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-caption text-brand-primary hover:underline"
              >
                Etherscan ↗
              </a>
            </div>
          ) : (
            <span className="text-caption font-medium text-success-text">
              Belum disetel (0x0000...0000)
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="op-agent" className="block text-body-sm text-text-secondary">
            Alamat Publik Akun Bound Relayer (0x...)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="op-agent"
              value={agentAddr}
              onChange={(e) => setAgentAddr(e.target.value)}
              placeholder="Alamat dompet Bound Relayer (0x...)"
              className="flex-1 min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body-sm font-mono"
            />
            <button
              type="button"
              onClick={() => void saveAgent()}
              disabled={agentBusy}
              className="min-h-[46px] px-6 rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body-sm font-semibold whitespace-nowrap disabled:opacity-60"
            >
              {agentBusy ? 'Menyimpan...' : 'Set Relayer'}
            </button>
          </div>
        </div>
      </section>

      {/* Toko Whitelist */}
      <section className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-4">
        <div>
          <h2 className="text-h3 font-semibold text-text-primary">Toko Whitelist</h2>
          <p className="text-body-sm text-text-secondary">
            Hanya alamat toko aktif di bawah ini yang dapat menerima dana belanja penerima.
          </p>
        </div>

        {whitelist.length > 0 && (
          <div className="divide-y divide-border-subtle rounded-default border border-border-subtle bg-bg-base px-4">
            {whitelist.map((s) => (
              <div key={s.addr} className="flex justify-between items-center py-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      s.active ? 'bg-brand-primary' : 'bg-border-subtle'
                    }`}
                  />
                  <span className="font-mono text-body-sm text-text-primary truncate">
                    {shortenAddress(s.addr, 10, 6)}
                  </span>
                  <span
                    className={`text-caption px-2 py-0.5 rounded-full ${
                      s.active
                        ? 'bg-brand-surface text-brand-primary'
                        : 'bg-bg-surface text-text-secondary'
                    }`}
                  >
                    {s.active ? 'Aktif' : 'Dihapus'}
                  </span>
                </div>
                {s.active && (
                  <button
                    type="button"
                    onClick={() => void delistStore(s.addr)}
                    className="text-body-sm text-error hover:underline shrink-0"
                    aria-label={`Hapus ${s.addr}`}
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={storeAddr}
            onChange={(e) => setStoreAddr(e.target.value)}
            placeholder="Alamat dompet toko (0x...)"
            className="flex-1 min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body-sm font-mono"
          />
          <button
            type="button"
            onClick={() => void addStore()}
            className="min-h-[46px] px-6 rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body-sm font-semibold whitespace-nowrap"
          >
            Tambah Toko
          </button>
        </div>
      </section>

      {/* Batch Register Recipients */}
      <section className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-h3 font-semibold text-text-primary">Daftar Penerima Manfaat</h2>
            <p className="text-body-sm text-text-secondary">
              Masukkan 1 penerima per baris dengan format <code className="font-mono">Nama,+628...</code>
            </p>
          </div>
          <span className="text-caption font-medium text-brand-primary bg-brand-surface px-2.5 py-1 rounded-full shrink-0">
            {recipientList.filter((r) => r.active).length} aktif
          </span>
        </div>

        {recipientList.length > 0 ? (
          <div className="divide-y divide-border-subtle rounded-default border border-border-subtle bg-bg-base px-4">
            {recipientList.map((r) => {
              const info = recipientLabels[r.addr.toLowerCase()];
              return (
                <div key={r.addr} className="flex justify-between items-center py-3 gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                        r.active ? 'bg-brand-primary' : 'bg-border-subtle'
                      }`}
                    />
                    <div className="min-w-0 space-y-0.5">
                      {info ? (
                        <p className="text-body-sm font-semibold text-text-primary truncate">
                          {info.nama}{' '}
                          <span className="font-normal text-text-secondary">({info.wa})</span>
                        </p>
                      ) : null}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-caption text-text-secondary">
                          {shortenAddress(r.addr, 10, 6)}
                        </span>
                        <span
                          className={`text-caption px-2 py-0.5 rounded-full ${
                            r.active
                              ? 'bg-brand-surface text-brand-primary'
                              : 'bg-bg-surface text-text-secondary'
                          }`}
                        >
                          {r.active ? 'Aktif' : 'Dicabut'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {r.active && (
                    <button
                      type="button"
                      onClick={() => void revokeRecipient(r.addr)}
                      className="text-body-sm text-error hover:underline shrink-0"
                      aria-label={`Cabut hak penerima ${info ? info.nama : r.addr}`}
                    >
                      Cabut
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-caption text-text-secondary rounded-default border border-border-subtle bg-bg-base px-4 py-3">
            Belum ada penerima yang tercatat pada rentang blok terbaru. Tambahkan di bawah ini.
          </p>
        )}

        <textarea
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          aria-label="Daftar penerima format nama dan nomor WA"
          placeholder={'Nama Penerima 1,+628xxxxxxxxxx\nNama Penerima 2,+628xxxxxxxxxx'}
          className="w-full min-h-[120px] rounded-default border border-border-subtle bg-bg-base p-3.5 text-body-sm font-mono"
        />
        <button
          type="button"
          onClick={() => void registerRecipients()}
          className="w-full min-h-[46px] rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body font-semibold"
        >
          Daftar Penerima ke Kontrak
        </button>
      </section>
    </div>
  );
}
