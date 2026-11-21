'use client';

const ERROR_MAP: Record<string, string> = {
  BUKAN_PENERIMA: 'Bukan penerima terdaftar',
  BUKAN_WHITELIST: 'Toko tidak terdaftar',
  JATAH_HABIS: 'Jatah habis',
  POOL_HABIS: 'Dana kampanye habis',
  LIMIT: 'Batas terlampaui',
  EXPIRED: 'QR kedaluwarsa',
  NONCE_DIGUNAKAN: 'QR sudah digunakan',
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