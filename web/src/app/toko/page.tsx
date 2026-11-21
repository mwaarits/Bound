'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { relayerPost } from '@/lib/relayer-client';

export default function TokoPage() {
  const [jumlah, setJumlah] = useState('');
  const [qr, setQr] = useState<{ nonce: number; expiry: number; payload: string } | null>(null);
  const [namaToko] = useState('Toko Demo');

  async function createQr() {
    const res = await relayerPost<{ nonce: number; expiry: number; payload: string }>('/store/qr-create', {
      toko: '0x0000000000000000000000000000000000000001',
      namaToko,
      jumlah,
    });
    setQr(res);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-6">
      <h1 className="text-h2 font-semibold">Buat QR Toko</h1>
      {!qr ? (
        <div className="space-y-4 w-full max-w-xs">
          <input type="number" inputMode="numeric" value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="Jumlah (IDR)" className="w-full min-h-[48px] rounded-default border border-border-subtle p-3 text-body-lg" />
          <button onClick={createQr} className="w-full min-h-[48px] rounded-default bg-brand-primary text-text-on-dark p-3 text-display-md">Buat QR</button>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <QRCodeSVG value={qr.payload} size={256} level="M" />
          <p className="text-body text-text-secondary">Berlalu 5 menit • Nomor {qr.nonce}</p>
        </div>
      )}
    </div>
  );
}