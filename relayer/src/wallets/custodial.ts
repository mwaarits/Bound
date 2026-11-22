import crypto from 'node:crypto';
import { ethers } from 'ethers';
import type { Database as DB } from 'better-sqlite3';

export function keygen(): { address: string; privateKey: string } {
  const w = ethers.Wallet.createRandom();
  return { address: w.address, privateKey: w.privateKey };
}

export function encrypt(plain: string, masterKeyHex: string): string {
  const key = Buffer.from(masterKeyHex.slice(2), 'hex');
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([c.update(plain), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), enc]).toString('hex');
}

export function decrypt(encHex: string, masterKeyHex: string): string {
  const buf = Buffer.from(encHex, 'hex');
  const key = Buffer.from(masterKeyHex.slice(2), 'hex');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const d = crypto.createDecipheriv('aes-256-gcm', key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString();
}

export function storeWallet(db: DB, wa: string, address: string, encKey: string): void {
  db.prepare('INSERT OR REPLACE INTO wa_wallets (wa, address, enc_priv_key, created_at) VALUES (?, ?, ?, ?)').run(wa.trim(), address, encKey, Date.now());
}

export function fetchWallet(db: DB, wa: string): { address: string; encKey: string } | undefined {
  const row = db.prepare('SELECT address, enc_priv_key FROM wa_wallets WHERE wa = ?').get(wa.trim()) as { address: string; enc_priv_key: string } | undefined;
  return row ? { address: row.address, encKey: row.enc_priv_key } : undefined;
}
