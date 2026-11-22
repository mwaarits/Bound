import 'dotenv/config';
import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { getDb } from './db/index.js';
import { requestOTPHandler, verifyOTPHandler } from './routes/auth.routes.js';
import { registerRecipientsHandler } from './routes/recipients.routes.js';
import { qrCreateHandler, checkoutHandler } from './routes/qr.routes.js';
import { faucetEmbeddedHandler, donateEmbeddedHandler } from './routes/donate.routes.js';

export const server = Fastify({ logger: false });

server.addHook('onRequest', async (req, reply) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') reply.status(204).send();
});

server.get('/health', async () => ({ status: 'ok' }));
server.post('/auth/request-otp', requestOTPHandler);
server.post('/auth/verify-otp', verifyOTPHandler);
server.post('/operator/recipients', registerRecipientsHandler);
server.post('/store/qr-create', qrCreateHandler);
server.post('/penerima/checkout', checkoutHandler);
server.post('/donatur/faucet-embedded', faucetEmbeddedHandler);
server.post('/donatur/donate-embedded', donateEmbeddedHandler);

export async function init() {
  const config = loadConfig();
  getDb();
  await server.listen({ port: config.PORT, host: config.HOST });
}

if (process.env.NODE_ENV !== 'test') {
  init().catch((err) => { console.error('init failed:', (err as Error).message); process.exit(1); });
}
