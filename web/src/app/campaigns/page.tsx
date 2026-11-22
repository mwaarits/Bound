'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { decodeEventLog } from 'viem';
import { campaignFactoryAbi } from '@/lib/abi';
import { compressImageFile, setCampaignMeta } from '@/lib/campaign-meta';
import {
  CAMPAIGN_FACTORY,
  MOCKIDRX_ADDRESS,
  addLocalCampaign,
  etherscanTxUrl,
  isValidAddress,
  parseIDRInputToWei,
  shortenAddress,
} from '@/lib/campaigns';
import { useCampaignList } from '@/hooks/useCampaignList';
import { CampaignCard } from '@/components/CampaignCard';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default function CampaignsPage() {
  const router = useRouter();
  const { campaigns, isLoading, error: listError, refresh } = useCampaignList();
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const isWrongNetwork = isConnected && walletChainId !== sepolia.id;

  const [showCreate, setShowCreate] = useState(false);
  const [lookupAddr, setLookupAddr] = useState('');
  const [lookupErr, setLookupErr] = useState('');

  // Create campaign form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [target, setTarget] = useState('50000000');
  const [jatah, setJatah] = useState('500000');
  const [maxPerTx, setMaxPerTx] = useState('200000');
  const [maxPerHari, setMaxPerHari] = useState('300000');
  const [submitting, setSubmitting] = useState(false);
  const [createStatus, setCreateStatus] = useState('');
  const [createError, setCreateError] = useState('');
  const [createdCampaign, setCreatedCampaign] = useState<{
    addr: `0x${string}`;
    txHash: `0x${string}`;
  } | null>(null);

  const factoryConfigured = isValidAddress(CAMPAIGN_FACTORY) && isValidAddress(MOCKIDRX_ADDRESS);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupErr('');
    const trimmed = lookupAddr.trim();
    if (!isValidAddress(trimmed)) {
      setLookupErr('Masukkan alamat kontrak kampanye yang valid (0x... 40 karakter hex).');
      return;
    }
    addLocalCampaign({ address: trimmed });
    router.push(`/campaign/${trimmed}`);
  }

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreateStatus('');
    setCreatedCampaign(null);

    if (!factoryConfigured) {
      setCreateError('Alamat CampaignFactory atau MockIDRX belum dikonfigurasi di environment.');
      return;
    }
    if (!title.trim()) {
      setCreateError('Judul kampanye wajib diisi.');
      return;
    }

    const jatahWei = parseIDRInputToWei(jatah);
    const maxTxWei = parseIDRInputToWei(maxPerTx);
    const maxHariWei = parseIDRInputToWei(maxPerHari);
    if (!jatahWei || !maxTxWei || !maxHariWei) {
      setCreateError('Pastikan Jatah, Maks/Transaksi, dan Maks/Hari berupa angka lebih dari 0.');
      return;
    }

    if (isWrongNetwork) {
      setCreateError('MetaMask masih di jaringan selain Sepolia. Klik "Ganti ke Sepolia" terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    setCreateStatus('Menunggu konfirmasi MetaMask...');
    try {
      const txHash = await writeContractAsync({
        chainId: sepolia.id,
        address: CAMPAIGN_FACTORY,
        abi: campaignFactoryAbi,
        functionName: 'createCampaign',
        args: [MOCKIDRX_ADDRESS, title.trim(), jatahWei, maxTxWei, maxHariWei],
      });

      setCreateStatus('Transaksi terkirim. Menunggu konfirmasi blok Sepolia...');
      let deployedAddr: `0x${string}` | null = null;

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: campaignFactoryAbi,
              data: log.data,
              topics: log.topics,
            });
            if (decoded.eventName === 'CampaignCreated' && decoded.args.campaign) {
              deployedAddr = decoded.args.campaign;
              break;
            }
          } catch {
            // Ignore non-matching logs
          }
        }
      }

      if (deployedAddr) {
        setCampaignMeta(deployedAddr, {
          title: title.trim(),
          description:
            description.trim() ||
            'Kampanye donasi terprogram. Dana hanya bisa dibelanjakan di toko whitelist.',
          target: target.trim() || '50000000',
          imageUrl: imageUrl.trim(),
        });
        addLocalCampaign({
          address: deployedAddr,
          name: title.trim(),
          operator: address,
        });
        setCreatedCampaign({ addr: deployedAddr, txHash });
        setCreateStatus('Kampanye baru berhasil dibuat di blockchain!');
        setTitle('');
        setDescription('');
        setImageUrl('');
        await refresh();
      } else {
        setCreateStatus('Transaksi berhasil! Cek Etherscan untuk melihat alamat kampanye baru.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setCreateError(
        msg.toLowerCase().includes('rejected')
          ? 'Transaksi dibatalkan di MetaMask.'
          : 'Gagal membuat kampanye. Pastikan Anda di jaringan Sepolia dan memiliki Sepolia ETH untuk gas.'
      );
      setCreateStatus('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 md:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-caption font-medium text-brand-primary">
            <span>Multi-Kampanye</span>
            <span>•</span>
            <span>{campaigns.length} Kampanye Terdeteksi</span>
          </div>
          <h1 className="text-h1 md:text-display-md text-text-primary">Daftar kampanye</h1>
          <p className="text-body text-text-secondary max-w-2xl">
            Setiap kampanye berjalan di kontrak Sepolia tersendiri dengan kolam dana, toko
            whitelist, dan daftar penerima masing-masing.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={isLoading}
            className="min-h-[44px] px-4 rounded-default border border-border-subtle bg-bg-surface text-body-sm font-medium text-text-primary hover:border-brand-primary transition-colors"
          >
            {isLoading ? 'Memuat...' : 'Muat Ulang'}
          </button>
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="min-h-[44px] px-5 rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body-sm font-semibold transition-colors"
          >
            {showCreate ? 'Tutup Form' : '+ Buat Kampanye Baru'}
          </button>
        </div>
      </div>

      {/* Create Campaign Drawer/Card */}
      {showCreate && (
        <section className="rounded-lg bg-bg-surface border border-brand-primary/30 p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-h3 font-semibold text-text-primary">
              Buat Kampanye Baru (CampaignFactory)
            </h2>
            <p className="text-body-sm text-text-secondary">
              Dompet MetaMask yang Anda hubungkan akan otomatis menjadi{' '}
              <strong className="text-text-primary">Operator</strong> kampanye ini.
            </p>
          </div>

          {!isConnected ? (
            <div className="rounded-lg bg-bg-base border border-border-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-body font-medium text-text-primary">
                  Hubungkan MetaMask untuk membuat kampanye
                </p>
                <p className="text-body-sm text-text-secondary">
                  Diperlukan tanda tangan MetaMask di jaringan Sepolia untuk deploy kontrak kampanye.
                </p>
              </div>
              <ConnectWalletButton variant="primary" />
            </div>
          ) : (
            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="camp-title" className="block text-body-sm font-medium text-text-primary mb-1">
                    Judul Kampanye *
                  </label>
                  <input
                    id="camp-title"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Bantuan Gempa Cianjur 2026"
                    className="w-full min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body"
                  />
                </div>
                <div>
                  <label htmlFor="camp-target" className="block text-body-sm font-medium text-text-primary mb-1">
                    Target Dana (IDR)
                  </label>
                  <input
                    id="camp-target"
                    type="number"
                    min="1"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body font-mono"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="camp-desc" className="block text-body-sm font-medium text-text-primary mb-1">
                  Deskripsi Kampanye
                </label>
                <textarea
                  id="camp-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan tujuan bantuan dan jenis kebutuhan yang bisa dibeli di toko whitelist..."
                  className="w-full min-h-[84px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="camp-image-url" className="block text-body-sm font-medium text-text-primary">
                  Foto Kampanye (opsional)
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  <label
                    htmlFor="camp-image-file"
                    className="min-h-[42px] px-4 rounded-default border border-border-subtle bg-bg-base hover:border-brand-primary text-body-sm font-medium text-text-primary inline-flex items-center cursor-pointer"
                  >
                    Upload Gambar
                    <input
                      id="camp-image-file"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const dataUrl = await compressImageFile(file);
                          setImageUrl(dataUrl);
                        } catch {
                          setCreateError('Gagal membaca file gambar.');
                        } finally {
                          e.target.value = '';
                        }
                      }}
                      className="sr-only"
                    />
                  </label>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="min-h-[42px] px-4 rounded-default border border-error/30 text-body-sm font-medium text-error hover:bg-error/5"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
                <input
                  id="camp-image-url"
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Atau tempel URL gambar (https://...)"
                  className="w-full min-h-[44px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2 text-body-sm"
                />
                {imageUrl && (
                  <div className="relative h-44 max-w-sm w-full rounded-default overflow-hidden border border-border-subtle bg-bg-base">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Pratinjau foto kampanye baru"
                      width={384}
                      height={176}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="camp-jatah" className="block text-body-sm font-medium text-text-primary mb-1">
                    Jatah per Penerima (IDR) *
                  </label>
                  <input
                    id="camp-jatah"
                    type="number"
                    required
                    min="1"
                    value={jatah}
                    onChange={(e) => setJatah(e.target.value)}
                    className="w-full min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="camp-maxtx" className="block text-body-sm font-medium text-text-primary mb-1">
                    Maks / Transaksi (IDR) *
                  </label>
                  <input
                    id="camp-maxtx"
                    type="number"
                    required
                    min="1"
                    value={maxPerTx}
                    onChange={(e) => setMaxPerTx(e.target.value)}
                    className="w-full min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="camp-maxhari" className="block text-body-sm font-medium text-text-primary mb-1">
                    Maks / Hari (IDR) *
                  </label>
                  <input
                    id="camp-maxhari"
                    type="number"
                    required
                    min="1"
                    value={maxPerHari}
                    onChange={(e) => setMaxPerHari(e.target.value)}
                    className="w-full min-h-[46px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2.5 text-body font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                {isWrongNetwork ? (
                  <button
                    type="button"
                    onClick={() => switchChain({ chainId: sepolia.id })}
                    disabled={isSwitching}
                    className="min-h-[46px] px-6 rounded-default bg-success text-text-primary text-body font-bold hover:opacity-90 disabled:opacity-60"
                  >
                    {isSwitching ? 'Mengganti ke Sepolia...' : 'Ganti ke Jaringan Sepolia'}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="min-h-[46px] px-6 rounded-default bg-brand-primary hover:bg-brand-primary-deep text-text-on-dark text-body font-semibold transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Membuat kampanye...' : 'Buat Kampanye via MetaMask'}
                  </button>
                )}
                {createStatus && (
                  <p className="text-body-sm text-text-secondary">{createStatus}</p>
                )}
              </div>

              {createError && (
                <div
                  role="alert"
                  className="rounded-default border border-error/25 bg-error/5 px-4 py-3 text-body-sm text-error"
                >
                  {createError}
                </div>
              )}

              {createdCampaign && (
                <div className="rounded-lg border border-brand-primary/30 bg-brand-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-body-sm font-semibold text-brand-primary">
                      Kampanye berhasil dibuat: {shortenAddress(createdCampaign.addr, 10, 6)}
                    </p>
                    <a
                      href={etherscanTxUrl(createdCampaign.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption text-brand-primary underline"
                    >
                      Lihat transaksi di Sepolia Etherscan ↗
                    </a>
                  </div>
                  <Link
                    href={`/campaign/${createdCampaign.addr}`}
                    className="min-h-[40px] px-4 rounded-default bg-brand-primary text-text-on-dark text-body-sm font-semibold flex items-center justify-center shrink-0"
                  >
                    Buka Dashboard →
                  </Link>
                </div>
              )}
            </form>
          )}
        </section>
      )}

      {/* Campaign Grid */}
      <section className="space-y-4">
        <h2 className="sr-only">Daftar Kampanye Aktif</h2>
        {listError && (
          <div
            role="alert"
            className="rounded-default border border-error/25 bg-error/5 px-4 py-3 text-body-sm text-error flex items-center justify-between gap-3"
          >
            <span>{listError}</span>
            <button
              type="button"
              onClick={() => void refresh()}
              className="underline font-semibold shrink-0"
            >
              Coba lagi
            </button>
          </div>
        )}
        {campaigns.length === 0 ? (
          <div className="rounded-lg bg-bg-surface border border-border-subtle p-10 text-center space-y-2">
            <p className="text-body-lg font-medium text-text-primary">Belum ada kampanye</p>
            <p className="text-body-sm text-text-secondary">
              Klik &ldquo;Buat Kampanye Baru&rdquo; di atas untuk mendeploy kampanye pertama.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center sm:justify-items-start">
            {campaigns.map((c) => (
              <CampaignCard key={c.address} campaign={c} />
            ))}
          </div>
        )}
      </section>

      {/* Open by contract address */}
      <section className="rounded-lg bg-bg-surface border border-border-subtle p-5 space-y-3">
        <div>
          <h2 className="text-body-lg font-semibold text-text-primary">
            Buka Kampanye dengan Alamat Kontrak
          </h2>
          <p className="text-body-sm text-text-secondary">
            Punya alamat kontrak kampanye Sepolia lain? Tempel di sini untuk langsung membuka dan
            menyimpannya ke daftar Anda.
          </p>
        </div>
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={lookupAddr}
            onChange={(e) => setLookupAddr(e.target.value)}
            placeholder="0x..."
            className="flex-1 min-h-[44px] rounded-default border border-border-subtle bg-bg-base px-3.5 py-2 text-body-sm font-mono"
          />
          <button
            type="submit"
            className="min-h-[44px] px-5 rounded-default bg-chrome-dark text-text-on-dark text-body-sm font-medium hover:opacity-90 shrink-0"
          >
            Buka Kampanye
          </button>
        </form>
        {lookupErr && <p className="text-caption text-error">{lookupErr}</p>}
      </section>
    </main>
  );
}
