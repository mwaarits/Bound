'use client';

import { useState } from 'react';
import { relayerPost } from '@/lib/relayer-client';
import { ErrorToast } from '@/components/ErrorToast';
import { QrScanner } from '@/components/QrScanner';
import { StepIndicator } from '@/components/StepIndicator';
import { formatIDR } from '@/lib/format';

const STEPS = ['Masuk', 'Hak Belanja', 'Bayar'];

export default function PenerimaPage() {
  const [wa, setWa] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<'login' | 'sisa' | 'scan' | 'result'>('login');
  const [scanMode, setScanMode] = useState<'camera' | 'paste'>('camera');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState('');
  const [receipt, setReceipt] = useState<{ namaToko: string; jumlah: string } | null>(null);

  const currentStep = stage === 'login' ? 0 : stage === 'sisa' ? 1 : stage === 'scan' ? 2 : 3;

  async function login() {
    setError('');
    setBusy(true);
    try {
      await relayerPost('/auth/request-otp', { wa });
      const res = await relayerPost<{ token?: string; error?: string }>('/auth/verify-otp', {
        wa,
        code,
      });
      if (res.token) {
        setToken(res.token);
        setStage('sisa');
      } else {
        setError(res.error ?? 'login gagal');
      }
    } catch {
      setError('CHAIN_ERROR');
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    setError('');
    setBusy(true);
    try {
      const res = await relayerPost<{ status: string; reason?: string }>(
        '/penerima/checkout',
        { payload },
        token
      );
      if (res.status === 'ok') setStage('result');
      else setError(res.reason ?? 'gagal');
    } catch {
      setError('CHAIN_ERROR');
    } finally {
      setBusy(false);
    }
  }

  function parseQrText(decoded: string) {
    setPayload(decoded);
    setError('');
    if (!decoded.trim()) {
      setReceipt(null);
      return;
    }
    try {
      const qr = JSON.parse(decoded);
      setReceipt({ namaToko: qr.namaToko ?? 'Toko', jumlah: String(qr.jumlah ?? '0') });
    } catch {
      setReceipt(null);
      setError('INVALID_QR');
    }
  }

  function formatSafeReceipt(jumlahStr: string): string {
    try {
      return formatIDR(BigInt(jumlahStr));
    } catch {
      return 'Rp 0';
    }
  }

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex items-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Info Card on desktop; stacks below form on phone */}
        <aside className="order-2 lg:order-1 lg:col-span-5 rounded-xl bg-bg-surface border border-border-subtle p-6 space-y-5 animate-enter">
          <div className="h-40 w-full rounded-lg bg-bg-base border border-border-subtle flex items-center justify-center p-3 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/penerima-payment.svg"
              alt="Ilustrasi pembayaran digital penerima menggunakan ponsel"
              width={160}
              height={160}
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-default bg-bg-base border border-border-subtle flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/qr-scan.svg" alt="" width={18} height={18} className="w-4 h-4" />
              </span>
              <h2 className="text-h3 font-semibold text-text-primary">
                Cara memakai hak belanja
              </h2>
            </div>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              Penerima memakai halaman ini untuk membayar belanja kebutuhan pokok di toko mitra
              tanpa MetaMask dan tanpa biaya gas.
            </p>
          </div>

          <ol className="space-y-3 border-t border-border-subtle pt-4">
            {[
              'Masuk dengan nomor WhatsApp yang sudah didaftarkan operator dan kode OTP.',
              'Pindai QR tagihan di kasir toko, atau tempel payload QR pada tab Tempel.',
              'Periksa nama toko dan nominal belanja di layar, lalu tekan Bayar.',
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-body-sm text-text-secondary">
                <span className="w-6 h-6 rounded-full bg-brand-surface text-brand-primary text-caption font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          <div className="rounded-lg bg-brand-surface border border-brand-primary/20 p-4 space-y-1">
            <p className="text-caption font-semibold text-brand-primary">Aturan penggunaan</p>
            <p className="text-caption text-text-secondary leading-relaxed">
              Hak belanja hanya berlaku di toko yang masuk daftar whitelist kampanye dan tidak
              bisa dicairkan menjadi uang tunai.
            </p>
          </div>
        </aside>

        {/* Main Interactive Flow Card */}
        <div className="order-1 lg:order-2 lg:col-span-7 w-full max-w-lg mx-auto lg:max-w-none space-y-5 animate-enter-delay-1">
          <StepIndicator steps={STEPS} current={currentStep} />

          {stage === 'login' && (
            <section
              key="stage-login"
              className="animate-pop rounded-xl bg-bg-base border border-border-subtle shadow-xs p-5 sm:p-7 space-y-5"
            >
              <div className="space-y-1">
                <h1 className="text-h2 font-bold text-text-primary">Login Penerima</h1>
                <p className="text-body-sm text-text-secondary">
                  Masuk dengan nomor WhatsApp terdaftar tanpa MetaMask dan tanpa gas fee.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label htmlFor="penerima-wa" className="block text-body-sm font-medium text-text-primary mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    id="penerima-wa"
                    value={wa}
                    onChange={(e) => setWa(e.target.value)}
                    placeholder="Nomor WA (+62...)"
                    className="w-full min-h-[48px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body-lg"
                  />
                </div>
                <div>
                  <label htmlFor="penerima-otp" className="block text-body-sm font-medium text-text-primary mb-1">
                    Kode OTP
                  </label>
                  <input
                    id="penerima-otp"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Kode OTP (123456)"
                    className="w-full min-h-[48px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body-lg font-mono"
                  />
                  <p className="text-caption text-text-secondary mt-1">
                    Mode demo: gunakan kode OTP <strong className="font-mono">123456</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void login()}
                  disabled={busy}
                  className="w-full min-h-[48px] rounded-default bg-brand-primary hover:bg-brand-primary-deep active:scale-[0.98] text-text-on-dark p-3 text-body-lg font-semibold transition-all disabled:opacity-60"
                >
                  {busy ? 'Memproses...' : 'Login'}
                </button>
              </div>

              {error && <ErrorToast reason={error} />}
            </section>
          )}

          {stage === 'sisa' && (
            <section
              key="stage-sisa"
              className="animate-pop rounded-xl bg-bg-base border border-border-subtle shadow-xs p-5 sm:p-7 space-y-6 text-center"
            >
              <div className="rounded-lg bg-brand-surface border border-brand-primary/20 p-6 space-y-2">
                <p className="text-body-sm font-medium text-brand-primary">Sisa Hak Belanja</p>
                <p className="text-numeric-penerima text-display-md text-text-primary font-bold">
                  Rp 500.000
                </p>
                <p className="text-caption text-text-secondary">
                  Jatah awal demo • Hanya berlaku di toko whitelist terdaftar
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStage('scan');
                }}
                className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep active:scale-[0.98] text-text-on-dark p-3 text-body-lg font-bold transition-all"
              >
                Scan QR
              </button>

              <button
                type="button"
                onClick={() => {
                  setToken('');
                  setStage('login');
                }}
                className="min-h-[44px] px-4 text-body-sm text-text-secondary hover:text-text-primary"
              >
                Keluar akun
              </button>
            </section>
          )}

          {stage === 'scan' && (
            <section
              key="stage-scan"
              className="animate-pop rounded-xl bg-bg-base border border-border-subtle shadow-xs p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-h2 font-bold text-text-primary">Scan QR Toko</h1>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStage('sisa');
                  }}
                  className="min-h-[44px] px-2 text-body-sm text-brand-primary font-medium"
                >
                  ← Kembali
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-bg-surface border border-border-subtle">
                <button
                  type="button"
                  onClick={() => setScanMode('camera')}
                  className={`min-h-[44px] py-2 px-3 rounded-default text-body-sm font-semibold transition-colors ${
                    scanMode === 'camera'
                      ? 'bg-brand-primary text-text-on-dark'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Kamera
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('paste')}
                  className={`min-h-[44px] py-2 px-3 rounded-default text-body-sm font-semibold transition-colors ${
                    scanMode === 'paste'
                      ? 'bg-brand-primary text-text-on-dark'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Tempel
                </button>
              </div>

              {scanMode === 'camera' ? (
                <QrScanner onScan={parseQrText} />
              ) : (
                <div className="space-y-1.5">
                  <p className="text-caption text-text-secondary">
                    Tempel payload JSON QR dari halaman Toko untuk demo tanpa kamera.
                  </p>
                  <textarea
                    value={payload}
                    onChange={(e) => parseQrText(e.target.value)}
                    placeholder="Tempel payload QR di sini"
                    className="w-full min-h-[120px] rounded-default border border-border-subtle p-3 text-body-sm font-mono"
                  />
                </div>
              )}

              {receipt && (
                <div className="space-y-3 pt-2 border-t border-border-subtle animate-pop">
                  <div className="rounded-lg bg-bg-surface p-4 space-y-1 border border-border-subtle">
                    <p className="text-caption text-text-secondary">Konfirmasi Tagihan</p>
                    <p className="text-numeric-penerima font-bold text-text-primary">
                      {formatSafeReceipt(receipt.jumlah)}
                    </p>
                    <p className="text-body-sm text-text-secondary">di {receipt.namaToko}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void checkout()}
                    disabled={busy}
                    className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep active:scale-[0.98] text-text-on-dark p-3 text-body-lg font-bold transition-all disabled:opacity-60"
                  >
                    {busy ? 'Memproses Pembayaran...' : 'Bayar'}
                  </button>
                </div>
              )}

              {error && <ErrorToast reason={error} />}
            </section>
          )}

          {stage === 'result' && (
            <section
              key="stage-result"
              className="animate-pop rounded-xl bg-bg-base border border-border-subtle shadow-xs p-6 sm:p-7 text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-brand-surface text-brand-primary text-h1 font-bold flex items-center justify-center mx-auto">
                ✓
              </div>
              <div className="space-y-1">
                <div className="inline-block rounded-full bg-success/20 text-success-text px-3 py-1 text-body-sm font-semibold">
                  Dibayar
                </div>
                {receipt && (
                  <p className="text-body text-text-secondary pt-2">
                    Pembayaran <strong className="text-text-primary">{formatSafeReceipt(receipt.jumlah)}</strong> ke{' '}
                    <strong className="text-text-primary">{receipt.namaToko}</strong> selesai.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setPayload('');
                  setReceipt(null);
                  setError('');
                  setStage('sisa');
                }}
                className="w-full min-h-[48px] rounded-default bg-brand-primary hover:bg-brand-primary-deep active:scale-[0.98] text-text-on-dark text-body font-semibold transition-all"
              >
                Kembali
              </button>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
