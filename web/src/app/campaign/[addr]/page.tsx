'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { relayerPost } from '@/lib/relayer-client';
import { campaignFactoryAbi, campaignAbi, mockIDRXAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';

const FACTORY = process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS as `0x${string}`;
const MOCKIDRX = process.env.NEXT_PUBLIC_MOCKIDRX_ADDRESS as `0x${string}`;
const CAMPAIGN = process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS as `0x${string}`;

export default function CampaignDashboard() {
  const [view, setView] = useState<'public' | 'operator'>('public');
  const { address } = useAccount();

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex gap-3">
        <button onClick={() => setView('public')} className={`flex-1 p-3 rounded-default text-body-lg ${view === 'public' ? 'bg-chrome-dark text-text-on-dark' : 'bg-bg-surface'}`}>Dashboard Publik</button>
        {address && <button onClick={() => setView('operator')} className={`flex-1 p-3 rounded-default text-body-lg ${view === 'operator' ? 'bg-chrome-dark text-text-on-dark' : 'bg-bg-surface'}`}>Operator</button>}
      </div>
      {view === 'public' ? <PublicDashboard /> : <OperatorPanel />}
    </div>
  );
}

function PublicDashboard() {
  const { data: pool } = useReadContract({ address: CAMPAIGN, abi: campaignAbi, functionName: 'token' });
  const { data: jatah } = useReadContract({ address: CAMPAIGN, abi: campaignAbi, functionName: 'jatahPerPenerima' });
  const { data: balance } = useReadContract({ address: MOCKIDRX, abi: mockIDRXAbi, functionName: 'balanceOf', args: [CAMPAIGN] });

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs">
        <p className="text-body text-text-secondary">Kolam Kampanye</p>
        <p className="text-numeric-ledger text-text-primary mt-1">{balance ? formatIDR(balance as bigint) : '...'}</p>
      </div>
      <div className="rounded-lg bg-bg-surface p-6 border border-border-subtle shadow-xs">
        <p className="text-body text-text-secondary">Jatah per Penerima</p>
        <p className="text-numeric-ledger text-text-primary mt-1">{jatah ? formatIDR(jatah as bigint) : '...'}</p>
      </div>
      <p className="text-body-sm text-text-secondary">Riwayat transaksi tersedia di chain events (Donasi, Belanja).</p>
    </div>
  );
}

function OperatorPanel() {
  const { writeContractAsync } = useWriteContract();
  const [storeName, setStoreName] = useState('');
  const [storeAddr, setStoreAddr] = useState('');
  const [recipients, setRecipients] = useState('');
  const [status, setStatus] = useState('');

  async function addStore() {
    if (!storeAddr) return;
    setStatus('menambah toko...');
    try { await writeContractAsync({ address: CAMPAIGN, abi: campaignAbi, functionName: 'setWhitelist', args: [storeAddr as `0x${string}`, true] }); setStatus(`toko ${storeAddr.slice(0,8)}... ditambah`); }
    catch { setStatus('gagal'); }
  }

  async function registerRecipients() {
    setStatus('mendaftar penerima...');
    const lines = recipients.trim().split('\n').filter(Boolean).map(l => { const [nama, wa] = l.split(','); return { nama: (nama ?? '').trim(), wa: (wa ?? '').trim() }; });
    const res = await relayerPost<{ recipients: { nama: string; wa: string; address: string }[] }>('/operator/recipients', { recipients: lines });
    const addrs = res.recipients.map(r => r.address);
    setStatus(`dompet dibuat, ${addrs.length} penerima. Tanda tangani setPenerimaBatch...`);
    try { await writeContractAsync({ address: CAMPAIGN, abi: campaignAbi, functionName: 'setPenerimaBatch', args: [addrs as `0x${string}`[], addrs.map(() => true)] }); setStatus(`${addrs.length} penerima terdaftar`); }
    catch { setStatus('tanda tangan gagal'); }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-h3 font-semibold">Daftar Toko Whitelist</h2>
        <input value={storeAddr} onChange={(e) => setStoreAddr(e.target.value)} placeholder="Alamat dompet toko (0x...)" className="w-full min-h-[48px] rounded-default border border-border-subtle p-3 text-body-lg" />
        <button onClick={addStore} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-body-lg">Tambah Toko</button>
      </div>
      <div className="space-y-3">
        <h2 className="text-h3 font-semibold">Daftar Penerima</h2>
        <p className="text-body-sm text-text-secondary">Format: nama,nomorWA per baris</p>
        <textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder={'Ani,+6281111111111\nBudi,+6281222222222'} className="w-full min-h-[120px] rounded-default border border-border-subtle p-3 text-body" />
        <button onClick={registerRecipients} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-body-lg">Daftar Penerima</button>
      </div>
      {status && <p className="text-body text-text-secondary">{status}</p>}
    </div>
  );
}