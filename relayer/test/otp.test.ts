import { describe, it, expect, beforeAll } from 'vitest';
import { server } from '../src/server.js';
import { OTPProvider, MockOTPProvider, otp } from '../src/auth/otp.js';
import { signJWT, verifyJWT } from '../src/auth/jwt.js';

describe('OTP mock', () => {
  const provider = new MockOTPProvider();

  it('known WA → verify 123456 returns true', async () => {
    provider.requestOTP('+6281234567890');
    expect(await provider.verifyOTP('+6281234567890', '123456')).toBe(true);
  });

  it('unknown WA → 404', async () => {
    const err = await provider.verifyOTP('+6289999999999', '123456').catch((e) => e);
    expect((err as Error & { statusCode: number }).statusCode).toBe(404);
  });

  it('known WA + wrong code → false', async () => {
    provider.requestOTP('+6281234567890');
    expect(await provider.verifyOTP('+6281234567890', '000000')).toBe(false);
  });
});

describe('JWT', () => {
  it('sign + verify roundtrip', async () => {
    const token = await signJWT({ wa: '+6281234567890', role: 'penerima' }, 900);
    const payload = await verifyJWT(token);
    expect(payload.wa).toBe('+6281234567890');
    expect(payload.role).toBe('penerima');
  });

  it('expired JWT rejects', async () => {
    const token = await signJWT({ wa: '+6281234567890', role: 'penerima' }, -1);
    await expect(verifyJWT(token)).rejects.toThrow();
  });
});

describe('auth routes', () => {
  beforeAll(async () => {
    await server.ready();
  });

  it('POST /auth/request-otp → 204', async () => {
    const res = await server.inject({ method: 'POST', url: '/auth/request-otp', payload: { wa: '+6281234567890' } });
    expect(res.statusCode).toBe(204);
  });

  it('POST /auth/verify-otp with 123456 → 200 + token', async () => {
    await server.inject({ method: 'POST', url: '/auth/request-otp', payload: { wa: '+6281234567890' } });
    const res = await server.inject({ method: 'POST', url: '/auth/verify-otp', payload: { wa: '+6281234567890', code: '123456' } });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.token).toBeDefined();
    expect(typeof body.token).toBe('string');
  });

  it('POST /auth/verify-otp wrong code → 401', async () => {
    await server.inject({ method: 'POST', url: '/auth/request-otp', payload: { wa: '+6289999999999' } });
    const res = await server.inject({ method: 'POST', url: '/auth/verify-otp', payload: { wa: '+6289999999999', code: '000000' } });
    expect(res.statusCode).toBe(401);
  });
});
