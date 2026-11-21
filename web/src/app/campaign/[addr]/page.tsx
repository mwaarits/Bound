'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { relayerPost } from '@/lib/relayer-client';
import { campaignAbi, mockIDRXAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';
import { getCampaignMeta, setCampaignMeta, type CampaignMeta } from '@/lib/campaign-meta';

const CAMPAIGN = process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS as `0x${string}`;
const MOCKIDRX = process.env.NEXT_PUBLIC_MOCKIDRX_ADDRESS as `0x${string}`;

export default function CampaignDashboard() {
  const [view, setView] = useState<'public' | 'operator'>('public');
  const { address } = useAccount();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 bg-bg-base text-text-primary md:bg-chrome-dark md:text-text-on-dark flex items-center justify-between">
        <span className="text-[28px] leading-none font-extrabold tracking-[-0.02em] md:text-[36px]">bound</span>
        <div className="flex gap-3">
          <button onClick={() => setView('public')} className={`px-4 py-2 rounded-default text-body-lg ${view === 'public' ? 'bg-brand-primary text-text-on-dark' : 'bg-bg-surface text-text-primary md:text-text-on-dark md:bg-white/10'}`}>Publik</button>
          {address && <button onClick={() => setView('operator')} className={`px-4 py-2 rounded-default text-body-lg ${view === 'operator' ? 'bg-brand-primary text-text-on-dark' : 'bg-bg-surface text-text-primary md:text-text-on-dark md:bg-white/10'}`}>Operator</button>}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8">
        {view === 'public' ? <PublicView /> : <OperatorView />}
      </main>
    </div>
  );
}

function PublicView() {
  const meta = getCampaignMeta(CAMPAIGN);
  const { data: pool } = useReadContract({ address: MOCKIDRX, abi: mockIDRXAbi, functionName: 'balanceOf', args: [CAMPAIGN] });
  const { data: jatah } = useReadContract({ address: CAMPAIGN, abi: campaignAbi, functionName: 'jatahPerPenerima' });
  const target = BigInt(meta.target) * 10n ** 18n;
  const poolNum = (pool as bigint) ?? 0n;
  const progress = target > 0n ? Math.min(100, Number(poolNum * 100n / target)) : 0;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-2">
        <h1 className="text-h1 font-semibold text-text-primary">{meta.title}</h1>
        <p className="text-body text-text-secondary">{meta.description}</p>
      </div>

      <div className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs">
        <p className="text-body text-text-secondary mb-2">Kolam Kampanye</p>
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-numeric-ledger text-text-primary text-h2">{formatIDR(poolNum)}</span>
          <span className="text-body-sm text-text-secondary">/ {formatIDR(target)}</span>
        </div>
        <div className="h-2 rounded-default bg-border-subtle overflow-hidden mb-1">
          <div className="h-full bg-brand-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-caption text-text-secondary">Terkumpul / Target</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-bg-surface p-4 border border-border-subtle shadow-xs">
          <p className="text-body-sm text-text-secondary">Jatah per Penerima</p>
          <p className="text-numeric-ledger text-text-primary mt-1">{jatah ? formatIDR(jatah as bigint) : '...'}</p>
        </div>
        <div className="rounded-lg bg-bg-surface p-4 border border-border-subtle shadow-xs">
          <p className="text-body-sm text-text-secondary">Penerima</p>
          <p className="text-numeric-ledger text-text-primary mt-1">3 terdaftar</p>
        </div>
      </div>

      <div className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs">
        <h2 className="text-h3 font-semibold text-text-primary mb-3">Riwayat Transaksi</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-border-ledger">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand-primary" />
              <span className="text-body text-text-primary">Donasi</span>
            </div>
            <span className="text-numeric-ledger text-text-primary">+{formatIDR(poolNum)}</span>
          </div>
          <p className="text-body-sm text-text-secondary py-2">Riwayat lengkap tersedia di chain events (Donasi, Belanja, WhitelistDiubah).</p>
        </div>
      </div>
    </div>
  );
}

function OperatorView() {
  const { writeContractAsync } = useWriteContract();
  const [meta, setMeta] = useState<CampaignMeta>(getCampaignMeta(CAMPAIGN));
  const [storeAddr, setStoreAddr] = useState('');
  const [recipients, setRecipients] = useState('');
  const [status, setStatus] = useState('');
  const [whitelist, setWhitelist] = useState<{ addr: string; active: boolean }[]>([]);

  function saveMeta() {
    setCampaignMeta(CAMPAIGN, meta);
    setStatus('Metadata disimpan');
    setTimeout(() => setStatus(''), 2000);
  }

  async function addStore() {
    if (!storeAddr) return;
    setStatus('Menambah toko...');
    try {
      await writeContractAsync({ address: CAMPAIGN, abi: campaignAbi, functionName: 'setWhitelist', args: [storeAddr as `0x${string}`, true] });
      setWhitelist([...whitelist, { addr: storeAddr, active: true }]);
      setStatus(`Toko ${storeAddr.slice(0, 8)}... ditambah`);
      setStoreAddr('');
    } catch { setStatus('Gagal menambah toko'); }
  }

  async function delistStore(addr: string) {
    setStatus('Menghapus toko...');
    try {
      await writeContractAsync({ address: CAMPAIGN, abi: campaignAbi, functionName: 'setWhitelist', args: [addr as `0x${string}`, false] });
      setWhitelist(whitelist.map((s) => s.addr === addr ? { ...s, active: false } : s));
      setStatus('Toko dihapus');
    } catch { setStatus('Gagal menghapus'); }
  }

  async function registerRecipients() {
    setStatus('Mendaftar penerima...');
    const lines = recipients.trim().split('\n').filter(Boolean).map((l) => {
      const [nama, wa] = l.split(',');
      return { nama: (nama ?? '').trim(), wa: (wa ?? '').trim() };
    });
    try {
      const res = await relayerPost<{ recipients: { nama: string; wa: string; address: string }[] }>('/operator/recipients', { recipients: lines });
      const addrs = res.recipients.map((r) => r.address);
      setStatus(`Dompet dibuat (${addrs.length} penerima). Tanda tangani setPenerimaBatch...`);
      await writeContractAsync({ address: CAMPAIGN, abi: campaignAbi, functionName: 'setPenerimaBatch', args: [addrs as `0x${string}`[], addrs.map(() => true)] });
      setStatus(`${addrs.length} penerima terdaftar`);
      setRecipients('');
    } catch { setStatus('Pendaftaran gagal'); }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-4">
        <h2 className="text-h3 font-semibold text-text-primary">Detail Kampanye</h2>
        <div className="space-y-3">
          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">Judul Kampanye</label>
            <input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} className="w-full min-h-[48px] rounded-default border border-border-subtle p-3 text-body-lg" />
          </div>
          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">Deskripsi</label>
            <textarea value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} className="w-full min-h-[80px] rounded-default border border-border-subtle p-3 text-body" />
          </div>
          <div>
            <label className="text-body-sm text-text-secondary mb-1 block">Target Dana (IDR)</label>
            <input type="number" value={meta.target} onChange={(e) => setMeta({ ...meta, target: e.target.value })} className="w-full min-h-[48px] rounded-default border border-border-subtle p-3 text-body-lg" />
          </div>
          <button onClick={saveMeta} className="min-h-[48px] px-6 rounded-default bg-brand-primary text-text-on-dark text-body-lg">Simpan</button>
        </div>
      </section>

      <section className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-4">
        <h2 className="text-h3 font-semibold text-text-primary">Toko Whitelist</h2>
        {whitelist.length > 0 && (
          <div className="space-y-2">
            {whitelist.map((s) => (
              <div key={s.addr} className="flex justify-between items-center py-2 border-b border-border-ledger">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${s.active ? 'bg-brand-primary' : 'bg-border-subtle'}`} />
                  <span className="text-body text-text-primary">{s.addr.slice(0, 10)}...{s.addr.slice(-4)}</span>
                  <span className="text-body-sm text-text-secondary">{s.active ? 'Aktif' : 'Dihapus'}</span>
                </div>
                {s.active && <button onClick={() => delistStore(s.addr)} className="text-body-sm text-error hover:opacity-80" aria-label={`Hapus ${s.addr}`}>Hapus</button>}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <input value={storeAddr} onChange={(e) => setStoreAddr(e.target.value)} placeholder="Alamat dompet toko (0x...)" className="flex-1 min-h-[48px] rounded-default border border-border-subtle p-3 text-body-lg" />
          <button onClick={addStore} className="min-h-[48px] px-6 rounded-default bg-brand-primary text-text-on-dark text-body-lg whitespace-nowrap">Tambah Toko</button>
        </div>
      </section>

      <section className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs space-y-4">
        <h2 className="text-h3 font-semibold text-text-primary">Daftar Penerima</h2>
        <p className="text-body-sm text-text-secondary">Format: nama,nomorWA per baris</p>
        <textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder={'Ani,+6281111111111\nBudi,+6281222222222\nCitra,+6281333333333'} className="w-full min-h-[120px] rounded-default border border-border-subtle p-3 text-body" />
        <button onClick={registerRecipients} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark text-body-lg">Daftar Penerima</button>
      </section>

      {status && <p className="text-body text-text-secondary">{status}</p>}
    </div>
  );
}