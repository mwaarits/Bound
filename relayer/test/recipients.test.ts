import { describe, it, expect, beforeAll } from 'vitest';
import { server } from '../src/server.js';

describe('recipients endpoint', () => {
  beforeAll(async () => {
    await server.ready();
  });

  it('POST /operator/recipients creates wallets and returns addresses', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/operator/recipients',
      payload: {
        recipients: [
          { nama: 'Ani', wa: '+6281111111111' },
          { nama: 'Budi', wa: '+6281222222222' },
          { nama: 'Citra', wa: '+6281333333333' },
        ],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.recipients).toHaveLength(3);
    expect(body.recipients[0].address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(body.recipients[0].nama).toBe('Ani');
    expect(body.recipients[0].wa).toBe('+6281111111111');
  });

  it('re-POST same WA returns same address (idempotent)', async () => {
    const first = await server.inject({
      method: 'POST',
      url: '/operator/recipients',
      payload: { recipients: [{ nama: 'Ani', wa: '+6281111111111' }] },
    });
    const second = await server.inject({
      method: 'POST',
      url: '/operator/recipients',
      payload: { recipients: [{ nama: 'Ani', wa: '+6281111111111' }] },
    });
    const a = JSON.parse(first.payload).recipients[0].address;
    const b = JSON.parse(second.payload).recipients[0].address;
    expect(a).toBe(b);
  });
});
