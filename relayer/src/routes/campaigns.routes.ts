import { FastifyRequest, FastifyReply } from 'fastify';
import { ethers } from 'ethers';
import { z } from 'zod';
import { getDb } from '../db/index.js';
import { createContracts } from '../contracts/bindings.js';
import { loadConfig } from '../config.js';

const ADDR_REGEX = /^0x[0-9a-fA-F]{40}$/;
const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000;

const MetaBodySchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(2000),
  target: z.string().trim().min(1).max(32),
  imageUrl: z.string().max(900_000).optional().default(''),
  timestamp: z.number().finite(),
  signature: z.string().min(1),
});

export interface CampaignMetaRow {
  address: string;
  title: string;
  description: string;
  target: string;
  imageUrl: string;
  updatedAt: number;
}

export function buildCampaignMetaMessage(address: string, timestamp: number): string {
  return `Bound: Simpan metadata kampanye ${address.toLowerCase()} (${timestamp})`;
}

let _ownerLookup = async (campaignAddr: string): Promise<string> => {
  const config = loadConfig();
  const { campaign } = createContracts({ ...config, CAMPAIGN_ADDRESS: campaignAddr });
  const owner = await (campaign as unknown as { owner: () => Promise<string> }).owner();
  return owner;
};

export function setOwnerLookupForTest(fn: (campaignAddr: string) => Promise<string>): void {
  _ownerLookup = fn;
}

export async function getCampaignsMetaHandler(_req: FastifyRequest, reply: FastifyReply) {
  const db = getDb();
  const rows = db
    .prepare('SELECT address, title, description, target, image_url, updated_at FROM campaign_meta')
    .all() as {
      address: string;
      title: string;
      description: string;
      target: string;
      image_url: string;
      updated_at: number;
    }[];

  const items: Record<string, CampaignMetaRow> = {};
  for (const r of rows) {
    items[r.address] = {
      address: r.address,
      title: r.title,
      description: r.description,
      target: r.target,
      imageUrl: r.image_url,
      updatedAt: r.updated_at,
    };
  }
  reply.send({ items });
}

export async function getCampaignMetaHandler(req: FastifyRequest, reply: FastifyReply) {
  const { addr } = req.params as { addr: string };
  if (!ADDR_REGEX.test(addr)) {
    return reply.status(400).send({ error: 'INVALID_ADDRESS' });
  }
  const normalized = addr.toLowerCase();
  const row = getDb()
    .prepare(
      'SELECT address, title, description, target, image_url, updated_at FROM campaign_meta WHERE address = ?'
    )
    .get(normalized) as
    | {
        address: string;
        title: string;
        description: string;
        target: string;
        image_url: string;
        updated_at: number;
      }
    | undefined;

  if (!row) {
    return reply.status(404).send({ error: 'NOT_FOUND' });
  }

  reply.send({
    address: row.address,
    title: row.title,
    description: row.description,
    target: row.target,
    imageUrl: row.image_url,
    updatedAt: row.updated_at,
  });
}

export async function postCampaignMetaHandler(req: FastifyRequest, reply: FastifyReply) {
  const { addr } = req.params as { addr: string };
  if (!ADDR_REGEX.test(addr)) {
    return reply.status(400).send({ error: 'INVALID_ADDRESS' });
  }

  const parsed = MetaBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({ error: 'INVALID_PAYLOAD' });
  }

  const { title, description, target, imageUrl, timestamp, signature } = parsed.data;
  if (Math.abs(Date.now() - timestamp) > MAX_TIMESTAMP_DRIFT_MS) {
    return reply.status(400).send({ error: 'EXPIRED_SIGNATURE' });
  }

  const normalized = addr.toLowerCase();
  let signer: string;
  try {
    signer = ethers.verifyMessage(buildCampaignMetaMessage(normalized, timestamp), signature);
  } catch {
    return reply.status(401).send({ error: 'INVALID_SIGNATURE' });
  }

  let owner: string;
  try {
    owner = await _ownerLookup(addr);
  } catch {
    return reply.status(502).send({ error: 'CHAIN_READ_FAILED' });
  }

  if (signer.toLowerCase() !== owner.toLowerCase()) {
    return reply.status(403).send({ error: 'BUKAN_OPERATOR' });
  }

  const updatedAt = Math.floor(Date.now() / 1000);
  getDb()
    .prepare(
      `INSERT INTO campaign_meta (address, title, description, target, image_url, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(address) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         target = excluded.target,
         image_url = excluded.image_url,
         updated_at = excluded.updated_at`
    )
    .run(normalized, title, description, target, imageUrl, updatedAt);

  reply.send({
    address: normalized,
    title,
    description,
    target,
    imageUrl,
    updatedAt,
  });
}
