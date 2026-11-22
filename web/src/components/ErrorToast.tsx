'use client';

const ERROR_MAP: Record<string, string> = {
  BUKAN_PENERIMA: 'Bukan penerima terdaftar',
  BUKAN_WHITELIST: 'Toko tidak terdaftar',
  JATAH_HABIS: 'Jatah habis',
  POOL_HABIS: 'Dana kampanye habis',
  LIMIT: 'Batas terlampaui',
  EXPIRED: 'QR kedaluwarsa',
  NONCE_DIGUNAKAN: 'QR sudah digunakan',
  BukanAgent: 'Relayer belum terdaftar sebagai agent pada kontrak kampanye',
  NO_RELAYER_GAS: 'Saldo SepoliaETH akun Bound Relayer habis untuk membayar gas.',
  INVALID_QR: 'Format QR tidak valid',
  invalid_code: 'Kode OTP salah. Gunakan kode 123456 untuk mode demo.',
  'OTP salah': 'Kode OTP salah. Gunakan kode 123456 untuk mode demo.',
  CHAIN_ERROR: 'Kesalahan jaringan',
  APPROVE_FAILED: 'Gagal menyetujui token',
};

export function ErrorToast({ reason }: { reason: string }) {
  const msg = ERROR_MAP[reason] ?? 'Terjadi kesalahan';
  return (
    <div role="alert" aria-live="polite" className="rounded-default border border-error/20 bg-error/5 p-4 text-body-lg text-error">
      {msg}
    </div>
  );
}