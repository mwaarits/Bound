'use client';

import { useState } from 'react';
import { relayerPost } from '@/lib/relayer-client';
import { ErrorToast } from '@/components/ErrorToast';
import { QrScanner } from '@/components/QrScanner';
import { formatIDR } from '@/lib/format';

export default function PenerimaPage() {
  const [wa, setWa] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<'login' | 'sisa' | 'scan' | 'result'>('login');
  const [scanMode, setScanMode] = useState<'camera' | 'paste'>('camera');
  const [error, setError] = useState('');
  const [payload, setPayload] = useState('');
  const [receipt, setReceipt] = useState<{ namaToko: string; jumlah: string } | null>(null);

  async function login() {
    setError('');
    await relayerPost('/auth/request-otp', { wa });
    const res = await relayerPost<{ token?: string; error?: string }>('/auth/verify-otp', { wa, code });
    if (res.token) { setToken(res.token); setStage('sisa'); }
    else setError(res.error ?? 'login gagal');
  }

  async function checkout() {
    setError('');
    const res = await relayerPost<{ status: string; reason?: string }>('/penerima/checkout', { payload }, token);
    if (res.status === 'ok') setStage('result');
    else setError(res.reason ?? 'gagal');
  }

  function onScan(decoded: string) {
    setPayload(decoded);
    try {
      const qr = JSON.parse(decoded);
      setReceipt({ namaToko: qr.namaToko ?? 'Toko', jumlah: qr.jumlah ?? '0' });
    } catch { setError('INVALID_QR'); }
  }

  if (stage === 'login') return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6 max-w-sm mx-auto">
      <h1 className="text-h2 font-semibold">Login Penerima</h1>
      <input value={wa} onChange={(e) => setWa(e.target.value)} placeholder="Nomor WA (+62...)" className="w-full min-h-[48px] rounded-default border border-border-subtle p-3 text-body-lg" />
      <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kode OTP (123456)" className="w-full min-h-[48px] rounded-default border border-border-subtle p-3 text-body-lg" />
      <button onClick={login} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-body-lg">Login</button>
      {error && <ErrorToast reason={error} />}
    </div>
  );

  if (stage === 'sisa') return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-6">
      <div className="text-center space-y-2">
        <p className="text-body-lg text-text-secondary">Sisa Hak Belanja</p>
        <p className="text-numeric-penerima text-text-primary">Rp 500.000</p>
      </div>
      <button onClick={() => setStage('scan')} className="w-full max-w-xs min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-display-md">Scan QR</button>
    </div>
  );

  if (stage === 'scan') return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6 max-w-sm mx-auto">
      <h1 className="text-h2 font-semibold">Scan QR Toko</h1>
      <div className="flex gap-3 w-full">
        <button onClick={() => setScanMode('camera')} className={`flex-1 p-3 rounded-default text-body-lg ${scanMode === 'camera' ? 'bg-brand-primary text-text-on-dark' : 'bg-bg-surface'}`}>Kamera</button>
        <button onClick={() => setScanMode('paste')} className={`flex-1 p-3 rounded-default text-body-lg ${scanMode === 'paste' ? 'bg-brand-primary text-text-on-dark' : 'bg-bg-surface'}`}>Tempel</button>
      </div>
      {scanMode === 'camera' ? (
        <QrScanner onScan={onScan} />
      ) : (
        <textarea value={payload} onChange={(e) => { setPayload(e.target.value); try { const qr = JSON.parse(e.target.value); setReceipt({ namaToko: qr.namaToko ?? 'Toko', jumlah: qr.jumlah ?? '0' }); } catch {} }} placeholder="Tempel payload QR di sini" className="w-full min-h-[120px] rounded-default border border-border-subtle p-3 text-body" />
      )}
      {receipt && (
        <div className="w-full space-y-3">
          <div className="rounded-lg bg-bg-surface p-5 space-y-2 border border-border-subtle">
            <p className="text-numeric-penerima text-text-primary">{formatIDR(BigInt(receipt.jumlah))}</p>
            <p className="text-body-lg text-text-secondary">di {receipt.namaToko}</p>
          </div>
          <button onClick={checkout} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-display-md">Bayar</button>
        </div>
      )}
      {error && <ErrorToast reason={error} />}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4 p-6">
      <div className="rounded-full bg-success p-4 text-text-primary text-body-lg font-medium">Dibayar</div>
      <button onClick={() => setStage('sisa')} className="text-body-lg text-brand-primary">Kembali</button>
    </div>
  );
}