import Fastify from 'fastify';
import { loadConfig } from './config.js';
import { openSqlite } from './db/sqlite.js';

export const server = Fastify({ logger: false });

server.get('/health', async () => ({ status: 'ok' }));

let db: ReturnType<typeof openSqlite> | null = null;

export async function init() {
  const config = loadConfig();
  db = openSqlite(':memory:');
  await server.listen({ port: config.PORT, host: config.HOST });
}

if (process.env.NODE_ENV !== 'test') {
  init().catch((err) => { console.error('init failed:', (err as Error).message); process.exit(1); });
}
