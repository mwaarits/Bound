'use client';

import { useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { relayerPost } from '@/lib/relayer-client';
import { mockIDRXAbi, campaignAbi } from '@/lib/abi';
import { formatIDR } from '@/lib/format';
import { ErrorToast } from '@/components/ErrorToast';

const MOCKIDRX = process.env.NEXT_PUBLIC_MOCKIDRX_ADDRESS as `0x${string}`;

export function DonateForm({ campaignAddr }: { campaignAddr: string }) {
  const [path, setPath] = useState<'own' | 'embedded'>('own');

  return (
    <div className="space-y-6 p-6 max-w-md mx-auto">
      <h1 className="text-h2 font-semibold">Donasi</h1>
      <div className="flex gap-3">
        <button onClick={() => setPath('own')} className={`flex-1 rounded-default p-3 text-body-lg ${path === 'own' ? 'bg-brand-primary text-text-on-dark' : 'bg-bg-surface text-text-secondary'}`}>Punya dompet</button>
        <button onClick={() => setPath('embedded')} className={`flex-1 rounded-default p-3 text-body-lg ${path === 'embedded' ? 'bg-brand-primary text-text-on-dark' : 'bg-bg-surface text-text-secondary'}`}>Tanpa dompet</button>
      </div>
      {path === 'own' ? <OwnWalletPath campaignAddr={campaignAddr} /> : <EmbeddedPath campaignAddr={campaignAddr} />}
    </div>
  );
}

function OwnWalletPath({ campaignAddr }: { campaignAddr: string }) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const [amount, setAmount] = useState('10000');
  const [status, setStatus] = useState('');

  if (!address) return <p className="text-body-lg text-text-secondary">Hubungkan dompet MetaMask untuk donasi.</p>;

  const jumlahRaw = BigInt(amount) * 10n ** 18n;

  async function faucet() {
    setStatus('faucet...');
    try { await writeContractAsync({ address: MOCKIDRX, abi: mockIDRXAbi, functionName: 'faucet' }); setStatus('faucet ok'); }
    catch { setStatus('faucet gagal'); }
  }

  async function approve() {
    setStatus('approve...');
    try { await writeContractAsync({ address: MOCKIDRX, abi: mockIDRXAbi, functionName: 'approve', args: [campaignAddr as `0x${string}`, BigInt(amount) * 10n ** 18n] }); setStatus('approve ok'); }
    catch { setStatus('approve gagal'); }
  }

  async function donate() {
    setStatus('donasi...');
    try { const tx = await writeContractAsync({ address: campaignAddr as `0x${string}`, abi: campaignAbi, functionName: 'donasi', args: [BigInt(amount) * 10n ** 18n] }); setStatus(`donasi ok: ${tx}`); }
    catch { setStatus('donasi gagal'); }
  }

  return (
    <div className="space-y-4">
      <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-default border border-border-subtle p-3 text-body-lg" aria-label="Jumlah donasi (IDR)" />
      <div className="space-y-2">
        <button onClick={faucet} className="w-full min-h-[48px] rounded-default bg-brand-surface text-brand-primary p-3 text-body-lg font-medium">Faucet 10 Juta mIDRX</button>
        <button onClick={approve} className="w-full min-h-[48px] rounded-default bg-bg-surface text-text-primary p-3 text-body-lg font-medium border border-border-subtle">Approve {formatIDR(BigInt(amount) * 10n ** 18n)}</button>
        <button onClick={donate} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-display-md">Donasi</button>
      </div>
      {status && <p className="text-body text-text-secondary">{status}</p>}
    </div>
  );
}

function EmbeddedPath({ campaignAddr }: { campaignAddr: string }) {
  const [wa, setWa] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [walletAddr, setWalletAddr] = useState('');
  const [amount, setAmount] = useState('10000');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function requestOtp() {
    setError(''); setStatus('mengirim OTP...');
    await relayerPost('/auth/request-otp', { wa });
    setStatus('OTP terkirim (kode: 123456)');
  }

  async function verifyOtp() {
    setError(''); setStatus('verifikasi...');
    const res = await relayerPost<{ token: string; walletAddress: string }>('/auth/verify-otp', { wa, code });
    if (res.token) { setToken(res.token); setWalletAddr(res.walletAddress); setStatus('login ok'); }
    else { setError('OTP salah'); setStatus(''); }
  }

  async function faucet() {
    setError(''); setStatus('faucet...');
    const res = await relayerPost<{ status: string; reason?: string }>('/donatur/faucet-embedded', {}, token);
    setStatus(res.status === 'ok' ? 'faucet ok' : `gagal: ${res.reason}`);
    if (res.status !== 'ok') setError(res.reason ?? 'unknown');
  }

  async function donate() {
    setError(''); setStatus('donasi...');
    const res = await relayerPost<{ status: string; reason?: string }>('/donatur/donate-embedded', { jumlah: amount }, token);
    setStatus(res.status === 'ok' ? 'donasi ok' : `gagal: ${res.reason}`);
    if (res.status !== 'ok') setError(res.reason ?? 'unknown');
  }

  return (
    <div className="space-y-4">
      {!token ? (
        <>
          <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="Nomor WA (+62...)" className="w-full rounded-default border border-border-subtle p-3 text-body-lg" />
          <button onClick={requestOtp} className="w-full min-h-[48px] rounded-default bg-bg-surface p-3 text-body-lg border border-border-subtle">Kirim OTP</button>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode OTP (123456)" className="w-full rounded-default border border-border-subtle p-3 text-body-lg" />
          <button onClick={verifyOtp} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-body-lg">Verifikasi</button>
        </>
      ) : (
        <>
          <p className="text-body-lg text-text-secondary">Dompet: {walletAddr.slice(0, 10)}...{walletAddr.slice(-4)}</p>
          <input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-default border border-border-subtle p-3 text-body-lg" aria-label="Jumlah donasi (IDR)" />
          <button onClick={faucet} className="w-full min-h-[48px] rounded-default bg-brand-surface text-brand-primary p-3 text-body-lg">Faucet mIDRX</button>
          <button onClick={donate} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-display-md">Donasi {formatIDR(BigInt(amount) * 10n ** 18n)}</button>
        </>
      )}
      {status && <p className="text-body text-text-secondary">{status}</p>}
      {error && <ErrorToast reason={error} />}
    </div>
  );
}