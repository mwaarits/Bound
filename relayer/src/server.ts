import 'dotenv/config';
import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { openSqlite } from './db/sqlite.js';
import { requestOTPHandler, verifyOTPHandler } from './routes/auth.routes.js';
import { registerRecipientsHandler } from './routes/recipients.routes.js';
import { qrCreateHandler, checkoutHandler } from './routes/qr.routes.js';
import { faucetEmbeddedHandler, donateEmbeddedHandler } from './routes/donate.routes.js';

export const server = Fastify({ logger: false });

server.get('/health', async () => ({ status: 'ok' }));
server.post('/auth/request-otp', requestOTPHandler);
server.post('/auth/verify-otp', verifyOTPHandler);
server.post('/operator/recipients', registerRecipientsHandler);
server.post('/store/qr-create', qrCreateHandler);
server.post('/penerima/checkout', checkoutHandler);
server.post('/donatur/faucet-embedded', faucetEmbeddedHandler);
server.post('/donatur/donate-embedded', donateEmbeddedHandler);

let db: ReturnType<typeof openSqlite> | null = null;

export async function init() {
  const config = loadConfig();
  db = openSqlite(':memory:');
  await server.listen({ port: config.PORT, host: config.HOST });
}

if (process.env.NODE_ENV !== 'test') {
  init().catch((err) => { console.error('init failed:', (err as Error).message); process.exit(1); });
}
