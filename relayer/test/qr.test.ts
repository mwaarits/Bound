import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { server } from '../src/server.js';
import { openSqlite } from '../src/db/sqlite.js';
import { createQR, consumeQR } from '../src/qr/registry.js';
import { decodeCanonicalError } from '../src/submit/belanja.js';
import { ethers } from 'ethers';

describe('QR registry', () => {
  let db: ReturnType<typeof openSqlite>;
  beforeEach(() => { db = openSqlite(':memory:'); });

  it('createQR returns nonce + 5-min expiry + payload with raw amount', () => {
    const qr = createQR(db, { campaign: '0xabc', toko: '0xdef', namaToko: 'Sumber Rejeki', jumlahIdr: '50000' });
    expect(qr.nonce).toBeGreaterThan(0);
    expect(qr.expiry).toBeGreaterThan(Date.now());
    expect(qr.expiry - Date.now()).toBeLessThanOrEqual(5 * 60 * 1000 + 1000);
    const payload = JSON.parse(qr.payload);
    expect(payload.jumlah).toBe('50000000000000000000000');
    expect(payload.nonce).toBe(qr.nonce);
  });

  it('consumeQR returns payload on first call', () => {
    const qr = createQR(db, { campaign: '0xabc', toko: '0xdef', namaToko: 'Toko', jumlahIdr: '100' });
    expect(consumeQR(db, qr.nonce)).toBe(qr.payload);
  });

  it('consumeQR returns null on second call (single-use)', () => {
    const qr = createQR(db, { campaign: '0xabc', toko: '0xdef', namaToko: 'Toko', jumlahIdr: '100' });
    consumeQR(db, qr.nonce);
    expect(consumeQR(db, qr.nonce)).toBeNull();
  });
});

describe('error decoder', () => {
  it('decodes BUKAN_PENERIMA', () => {
    expect(decodeCanonicalError(ethers.id('BUKAN_PENERIMA()').slice(0, 10))).toBe('BUKAN_PENERIMA');
  });
  it('decodes BUKAN_WHITELIST', () => {
    expect(decodeCanonicalError(ethers.id('BUKAN_WHITELIST()').slice(0, 10))).toBe('BUKAN_WHITELIST');
  });
  it('decodes JATAH_HABIS', () => {
    expect(decodeCanonicalError(ethers.id('JATAH_HABIS()').slice(0, 10))).toBe('JATAH_HABIS');
  });
  it('decodes EXPIRED', () => {
    expect(decodeCanonicalError(ethers.id('EXPIRED()').slice(0, 10))).toBe('EXPIRED');
  });
  it('decodes NONCE_DIGUNAKAN', () => {
    expect(decodeCanonicalError(ethers.id('NONCE_DIGUNAKAN()').slice(0, 10))).toBe('NONCE_DIGUNAKAN');
  });
  it('returns UNKNOWN for unrecognized', () => {
    expect(decodeCanonicalError('0xdeadbeef')).toBe('UNKNOWN');
  });
});

describe('store QR-create route', () => {
  beforeAll(async () => { await server.ready(); });

  it('POST /store/qr-create returns nonce + expiry + payload', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/store/qr-create',
      payload: {
        toko: '0x1234567890123456789012345678901234567890',
        namaToko: 'Sumber Rejeki',
        jumlah: '50000',
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.nonce).toBeGreaterThan(0);
    expect(body.expiry).toBeGreaterThan(Date.now());
    const payload = JSON.parse(body.payload);
    expect(payload.namaToko).toBe('Sumber Rejeki');
    expect(payload.jumlah).toBe('50000000000000000000000');
  });
});
