import { FastifyRequest, FastifyReply } from 'fastify';
import { ethers } from 'ethers';
import { otp } from '../auth/otp.js';
import { signJWT } from '../auth/jwt.js';
import { getDb } from '../db/index.js';
import { keygen, encrypt, storeWallet, fetchWallet } from '../wallets/custodial.js';
import { loadRelayerEOA } from '../wallets/relayer-eoa.js';
import { loadConfig } from '../config.js';

const config = loadConfig();

export async function requestOTPHandler(_req: FastifyRequest, reply: FastifyReply) {
  const { wa } = _req.body as { wa: string };
  otp.requestOTP(wa);
  reply.status(204).send();
}

export async function verifyOTPHandler(_req: FastifyRequest, reply: FastifyReply) {
  const { wa, code } = _req.body as { wa: string; code: string };
  try {
    const ok = await otp.verifyOTP(wa, code);
    if (!ok) return reply.status(401).send({ error: 'invalid_code' });
  } catch (err) {
    const e = err as { statusCode?: number };
    return reply.status(e.statusCode ?? 400).send({ error: 'wa_not_found' });
  }

  // Auto-create embedded wallet if not exists (donor path-B first login)
  const db = getDb();
  let wallet = fetchWallet(db, wa);
  if (!wallet) {
    const { address, privateKey } = keygen();
    const enc = encrypt(privateKey, config.MASTER_KEY);
    storeWallet(db, wa, address, enc);
    wallet = { address, encKey: enc };

    // Fire-and-forget stipend: 0.001 Sepolia-ETH for donor gas (BR-10)
    if (process.env.NODE_ENV !== 'test') {
      const w = loadRelayerEOA(config.RELAYER_PRIVATE_KEY, config.RPC_URL);
      w.sendTransaction({ to: address, value: ethers.parseEther('0.001') }).catch(() => {});
    }
  }

  const token = await signJWT({ wa, role: 'penerima' }, 900);
  reply.send({ token, walletAddress: wallet.address });
}
