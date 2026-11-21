import { describe, it, expect, beforeAll } from 'vitest';
import { server } from '../src/server.js';

describe('donate routes', () => {
  beforeAll(async () => { await server.ready(); });

  it('verify-otp creates wallet + returns address for new WA', async () => {
    await server.inject({ method: 'POST', url: '/auth/request-otp', payload: { wa: '+6284444444444' } });
    const res = await server.inject({ method: 'POST', url: '/auth/verify-otp', payload: { wa: '+6284444444444', code: '123456' } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.token).toBeDefined();
    expect(body.walletAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('verify-otp existing WA returns same wallet address', async () => {
    await server.inject({ method: 'POST', url: '/auth/request-otp', payload: { wa: '+6285555555555' } });
    const a = await server.inject({ method: 'POST', url: '/auth/verify-otp', payload: { wa: '+6285555555555', code: '123456' } });
    await server.inject({ method: 'POST', url: '/auth/request-otp', payload: { wa: '+6285555555555' } });
    const b = await server.inject({ method: 'POST', url: '/auth/verify-otp', payload: { wa: '+6285555555555', code: '123456' } });
    expect(JSON.parse(a.payload).walletAddress).toBe(JSON.parse(b.payload).walletAddress);
  });

  it('faucet-embedded without token → 401', async () => {
    const res = await server.inject({ method: 'POST', url: '/donatur/faucet-embedded' });
    expect(res.statusCode).toBe(401);
  });

  it('donate-embedded without token → 401', async () => {
    const res = await server.inject({ method: 'POST', url: '/donatur/donate-embedded', payload: { jumlah: '10000' } });
    expect(res.statusCode).toBe(401);
  });
});
