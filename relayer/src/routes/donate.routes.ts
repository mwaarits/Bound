import { FastifyRequest, FastifyReply } from 'fastify';
import { ethers } from 'ethers';
import { verifyJWT } from '../auth/jwt.js';
import { getDb } from '../db/index.js';
import { fetchWallet, decrypt } from '../wallets/custodial.js';
import { createContracts } from '../contracts/bindings.js';
import { loadConfig } from '../config.js';

const config = loadConfig();

async function getDonorWallet(req: FastifyRequest): Promise<ethers.Wallet | null> {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const token = auth.replace('Bearer ', '');
  let wa: string;
  try {
    const payload = await verifyJWT(token);
    wa = payload.wa as string;
  } catch {
    return null;
  }
  const wallet = fetchWallet(getDb(), wa);
  if (!wallet) return null;
  const privateKey = decrypt(wallet.encKey, config.MASTER_KEY);
  return new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(config.RPC_URL));
}

export async function faucetEmbeddedHandler(_req: FastifyRequest, reply: FastifyReply) {
  const donor = await getDonorWallet(_req);
  if (!donor) return reply.status(401).send({ error: 'unauthorized' });

  const { mockIDRX } = createContracts(config, donor);
  try {
    const tx = await (mockIDRX as any).faucet();
    const rc = await tx.wait();
    reply.send({ txHash: rc.hash, status: 'ok' });
  } catch {
    reply.send({ txHash: '', status: 'revert', reason: 'CHAIN_ERROR' });
  }
}

export async function donateEmbeddedHandler(req: FastifyRequest, reply: FastifyReply) {
  const donor = await getDonorWallet(req);
  if (!donor) return reply.status(401).send({ error: 'unauthorized' });

  const { jumlah } = req.body as { jumlah: string };
  const jumlahRaw = BigInt(jumlah) * 10n ** 18n;
  const { mockIDRX, campaign } = createContracts(config, donor);

  try {
    const approveTx = await (mockIDRX as any).approve(config.CAMPAIGN_ADDRESS, jumlahRaw);
    await approveTx.wait();
  } catch {
    return reply.send({ txHash: '', status: 'revert', reason: 'APPROVE_FAILED' });
  }

  try {
    const tx = await (campaign as any).donasi(jumlahRaw);
    const rc = await tx.wait();
    reply.send({ txHash: rc.hash, status: 'ok' });
  } catch {
    reply.send({ txHash: '', status: 'revert', reason: 'CHAIN_ERROR' });
  }
}
