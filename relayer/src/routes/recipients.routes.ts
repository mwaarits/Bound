import { FastifyRequest, FastifyReply } from 'fastify';
import { getDb } from '../db/index.js';
import { keygen, encrypt, storeWallet, fetchWallet } from '../wallets/custodial.js';
import { loadConfig } from '../config.js';

const config = loadConfig();

export async function registerRecipientsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { recipients } = req.body as { recipients: { nama: string; wa: string }[] };
  const db = getDb();
  const result = recipients.map((r) => {
    let existing = fetchWallet(db, r.wa);
    if (!existing) {
      const { address, privateKey } = keygen();
      const enc = encrypt(privateKey, config.MASTER_KEY);
      storeWallet(db, r.wa, address, enc);
      existing = { address, encKey: enc };
    }
    return { nama: r.nama, wa: r.wa, address: existing.address };
  });
  reply.send({ recipients: result });
}
