'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAccount } from 'wagmi';
import { relayerPost } from '@/lib/relayer-client';
import { formatIDR } from '@/lib/format';
import { isValidAddress, parseIDRInputToWei } from '@/lib/campaigns';
import { StepIndicator } from '@/components/StepIndicator';

const DEFAULT_STORE_ADDR = '0x0000000000000000000000000000000000000001';
const PRESETS = ['25000', '50000', '100000', '150000'];

export default function TokoPage() {
  const { address } = useAccount();
  const [namaToko, setNamaToko] = useState('Toko Demo');
  const [tokoAddr, setTokoAddr] = useState(DEFAULT_STORE_ADDR);
  const [jumlah, setJumlah] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<{ nonce: number; expiry: number; payload: string } | null>(null);

  useEffect(() => {
    if (address && tokoAddr === DEFAULT_STORE_ADDR) {
      setTokoAddr(address);
    }
  }, [address, tokoAddr]);

  async function createQr() {
    setError('');
    if (!jumlah.trim() || Number(jumlah) <= 0) {
      setError('Masukkan nominal tagihan (IDR) lebih dari 0.');
      return;
    }
    const cleanAddr = tokoAddr.trim();
    if (!isValidAddress(cleanAddr)) {
      setError('Alamat dompet toko harus berupa alamat Ethereum yang valid (0x...).');
      return;
    }
    setBusy(true);
    try {
      const res = await relayerPost<{ nonce: number; expiry: number; payload: string }>(
        '/store/qr-create',
        {
          toko: cleanAddr,
          namaToko: namaToko.trim() || 'Toko Demo',
          jumlah: jumlah.trim(),
        }
      );
      setQr(res);
    } catch {
      setError('Gagal membuat QR. Pastikan server relayer sedang berjalan.');
    } finally {
      setBusy(false);
    }
  }

  function copyPayload() {
    if (!qr) return;
    navigator.clipboard?.writeText(qr.payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const parsedWei = parseIDRInputToWei(jumlah);

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 flex items-center">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Info Card on desktop; stacks below form on phone */}
        <aside className="order-2 lg:order-1 lg:col-span-5 rounded-xl bg-bg-surface border border-border-subtle p-6 space-y-5 animate-enter">
          <div className="h-48 w-full rounded-lg bg-bg-base border border-border-subtle flex items-center justify-center p-4 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustrations/toko-shopping.svg"
              alt="Ilustrasi transaksi belanja di toko mitra"
              width={210}
              height={140}
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-default bg-bg-base border border-border-subtle flex items-center justify-center shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/store.svg" alt="" width={18} height={18} className="w-4 h-4" />
              </span>
              <h2 className="text-h3 font-semibold text-text-primary">
                Panduan kasir toko mitra
              </h2>
            </div>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              Buat QR tagihan sekali pakai setiap kali penerima bantuan berbelanja di toko Anda.
            </p>
          </div>

          <ol className="space-y-3 border-t border-border-subtle pt-4">
            {[
              'Pastikan alamat dompet toko sudah didaftarkan operator ke daftar whitelist kampanye.',
              'Isi nama toko dan nominal belanja dalam Rupiah, lalu tekan Buat QR.',
              'Tunjukkan QR ke penerima untuk dipindai, atau salin payload QR pada mode demo.',
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
            <p className="text-caption font-semibold text-brand-primary">Masa berlaku & pencairan</p>
            <p className="text-caption text-text-secondary leading-relaxed">
              Setiap QR berlaku 5 menit dan hanya bisa dipakai sekali. Begitu penerima membayar,
              token m-IDRX langsung masuk ke alamat dompet toko tanpa biaya gas.
            </p>
          </div>
        </aside>

        {/* Main QR Generator Card */}
        <div className="order-1 lg:order-2 lg:col-span-7 w-full max-w-lg mx-auto lg:max-w-none space-y-5 animate-enter-delay-1">
          <StepIndicator steps={['Buat Tagihan', 'Tunjukkan QR']} current={qr ? 1 : 0} />

          <section className="rounded-xl bg-bg-base border border-border-subtle shadow-xs p-5 sm:p-7 space-y-5">
            <div className="space-y-1">
              <h1 className="text-h2 font-bold text-text-primary">Buat QR Toko</h1>
              <p className="text-body-sm text-text-secondary">
                Masukkan nominal belanja penerima untuk menerbitkan QR tagihan sekali pakai.
              </p>
            </div>

            {!qr ? (
              <div key="toko-form" className="space-y-4 animate-pop">
                <div>
                  <label htmlFor="toko-nama" className="block text-body-sm font-medium text-text-primary mb-1">
                    Nama Toko
                  </label>
                  <input
                    id="toko-nama"
                    value={namaToko}
                    onChange={(e) => setNamaToko(e.target.value)}
                    placeholder="Nama Toko"
                    className="w-full min-h-[46px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body"
                  />
                </div>

                <div>
                  <label htmlFor="toko-addr" className="block text-body-sm font-medium text-text-primary mb-1">
                    Alamat Dompet Toko (Whitelist)
                  </label>
                  <input
                    id="toko-addr"
                    value={tokoAddr}
                    onChange={(e) => setTokoAddr(e.target.value)}
                    placeholder="0x..."
                    className="w-full min-h-[46px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body-sm font-mono"
                  />
                  <p className="text-caption text-text-secondary mt-1">
                    Otomatis terisi dari MetaMask jika terhubung, atau gunakan alamat demo.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="toko-jumlah" className="block text-body-sm font-medium text-text-primary">
                    Nominal Tagihan (IDR)
                  </label>
                  <input
                    id="toko-jumlah"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    placeholder="Jumlah (IDR)"
                    className="w-full min-h-[48px] rounded-default border border-border-subtle px-3.5 py-2.5 text-body-lg font-mono"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESETS.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setJumlah(v)}
                        className={`min-h-[44px] py-1.5 px-2 rounded-default text-caption font-medium border transition-colors ${
                          jumlah === v
                            ? 'bg-brand-surface border-brand-primary text-brand-primary'
                            : 'bg-bg-surface border-border-subtle text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {Number(v) / 1000}rb
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void createQr()}
                  disabled={busy}
                  className="w-full min-h-[52px] rounded-default bg-brand-primary hover:bg-brand-primary-deep active:scale-[0.98] text-text-on-dark p-3 text-body-lg font-bold transition-all disabled:opacity-60"
                >
                  {busy ? 'Membuat QR...' : 'Buat QR'}
                </button>

                {error && (
                  <div
                    role="alert"
                    className="rounded-default border border-error/25 bg-error/5 p-3.5 text-body-sm text-error"
                  >
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div key="toko-qr" className="flex flex-col items-center space-y-5 animate-pop">
                <div className="w-full rounded-lg bg-bg-surface border border-border-subtle p-4 text-center space-y-1">
                  <p className="text-caption text-text-secondary">{namaToko}</p>
                  <p className="text-numeric-penerima font-bold text-text-primary">
                    {parsedWei ? formatIDR(parsedWei) : `Rp ${jumlah}`}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white border border-border-subtle shadow-xs max-w-full">
                  <QRCodeSVG value={qr.payload} size={224} level="M" />
                </div>

                <p className="text-body-sm text-text-secondary">
                  Berlalu 5 menit • Nomor <span className="font-mono font-medium">{qr.nonce}</span>
                </p>

                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={copyPayload}
                    className="min-h-[44px] px-4 rounded-default bg-brand-surface border border-brand-primary/25 text-brand-primary text-body-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {copied ? '✓ Payload Tersalin' : 'Salin Payload QR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQr(null);
                      setCopied(false);
                    }}
                    className="min-h-[44px] px-4 rounded-default bg-bg-surface border border-border-subtle text-text-primary text-body-sm font-medium hover:border-brand-primary active:scale-[0.98] transition-all"
                  >
                    Buat QR Baru
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
