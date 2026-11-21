import type { Database as DB } from 'better-sqlite3';

export function createQR(db: DB, opts: { campaign: string; toko: string; namaToko: string; jumlahIdr: string }) {
  const nonce = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  const expiry = Date.now() + 5 * 60 * 1000;
  const jumlahRaw = (BigInt(opts.jumlahIdr) * 10n ** 18n).toString();
  const payload = JSON.stringify({ campaign: opts.campaign, toko: opts.toko, namaToko: opts.namaToko, jumlah: jumlahRaw, nonce, expiry });
  db.prepare('INSERT INTO qr_nonces (nonce, payload, expiry) VALUES (?, ?, ?)').run(nonce, payload, expiry);
  return { nonce, expiry, payload };
}

export function consumeQR(db: DB, nonce: number): string | null {
  const row = db.prepare('SELECT payload, expiry, consumed FROM qr_nonces WHERE nonce = ?').get(nonce) as { payload: string; expiry: number; consumed: number } | undefined;
  if (!row || row.consumed || row.expiry < Date.now()) return null;
  db.prepare('UPDATE qr_nonces SET consumed = 1 WHERE nonce = ?').run(nonce);
  return row.payload;
}
