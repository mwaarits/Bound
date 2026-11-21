import { describe, it, expect, beforeAll } from 'vitest';
import { server } from '../src/server.js';

describe('health', () => {
  beforeAll(async () => {
    await server.ready();
  });

  it('GET /health returns { status: "ok" } with 200', async () => {
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ status: 'ok' });
  });
});
