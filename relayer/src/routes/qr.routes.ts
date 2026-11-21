import { FastifyRequest, FastifyReply } from 'fastify';
import { getDb } from '../db/index.js';
import { createQR, consumeQR } from '../qr/registry.js';
import { loadConfig } from '../config.js';
import { fetchWallet } from '../wallets/custodial.js';
import { verifyJWT } from '../auth/jwt.js';
import { loadRelayerEOA } from '../wallets/relayer-eoa.js';
import { createContracts } from '../contracts/bindings.js';
import { submitBelanja } from '../submit/belanja.js';

const config = loadConfig();

export async function qrCreateHandler(req: FastifyRequest, reply: FastifyReply) {
  const { toko, namaToko, jumlah } = req.body as { toko: string; namaToko: string; jumlah: string };
  const qr = createQR(getDb(), { campaign: config.CAMPAIGN_ADDRESS, toko, namaToko, jumlahIdr: jumlah });
  reply.send(qr);
}

export async function checkoutHandler(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization;
  if (!auth) return reply.status(401).send({ error: 'no_token' });
  const token = auth.replace('Bearer ', '');

  let wa: string;
  try {
    const payload = await verifyJWT(token);
    wa = payload.wa as string;
  } catch {
    return reply.status(401).send({ error: 'invalid_token' });
  }

  const db = getDb();
  const wallet = fetchWallet(db, wa);
  if (!wallet) return reply.status(404).send({ error: 'wallet_not_found' });

  const { payload: payloadStr } = req.body as { payload: string };
  const qr = JSON.parse(payloadStr);

  const relayer = loadRelayerEOA(config.RELAYER_PRIVATE_KEY, config.RPC_URL);
  const { campaign } = createContracts(config, relayer);

  const result = await submitBelanja(campaign, {
    penerima: wallet.address,
    toko: qr.toko,
    jumlah: BigInt(qr.jumlah),
    nonce: BigInt(qr.nonce),
    expiry: BigInt(qr.expiry),
  });

  if (result.status === 'ok') {
    consumeQR(db, Number(qr.nonce));
  }

  reply.send(result);
}
