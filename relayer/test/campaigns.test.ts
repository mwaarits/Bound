import { describe, it, expect, beforeEach } from 'vitest';
import { ethers } from 'ethers';
import { openSqlite } from '../src/db/sqlite.js';
import { setDb } from '../src/db/index.js';
import { server } from '../src/server.js';
import {
  buildCampaignMetaMessage,
  setOwnerLookupForTest,
} from '../src/routes/campaigns.routes.js';

const CAMPAIGN_ADDR = '0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef';

describe('campaign metadata routes', () => {
  const operatorWallet = ethers.Wallet.createRandom();
  const strangerWallet = ethers.Wallet.createRandom();

  beforeEach(() => {
    setDb(openSqlite(':memory:'));
    setOwnerLookupForTest(async () => operatorWallet.address);
  });

  it('returns 404 for unknown campaign metadata and empty list initially', async () => {
    const listRes = await server.inject({ method: 'GET', url: '/campaigns/meta' });
    expect(listRes.statusCode).toBe(200);
    expect(listRes.json()).toEqual({ items: {} });

    const singleRes = await server.inject({
      method: 'GET',
      url: `/campaigns/${CAMPAIGN_ADDR}/meta`,
    });
    expect(singleRes.statusCode).toBe(404);
  });

  it('saves and fetches campaign metadata when signed by contract owner', async () => {
    const timestamp = Date.now();
    const signature = await operatorWallet.signMessage(
      buildCampaignMetaMessage(CAMPAIGN_ADDR, timestamp)
    );

    const postRes = await server.inject({
      method: 'POST',
      url: `/campaigns/${CAMPAIGN_ADDR}/meta`,
      payload: {
        title: 'Banjir Demak 2025',
        description: 'Bantuan sembako untuk warga terdampak banjir.',
        target: '50000000',
        imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
        timestamp,
        signature,
      },
    });
    expect(postRes.statusCode).toBe(200);
    expect(postRes.json().address).toBe(CAMPAIGN_ADDR.toLowerCase());
    expect(postRes.json().imageUrl).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg==');

    const getRes = await server.inject({
      method: 'GET',
      url: `/campaigns/${CAMPAIGN_ADDR.toLowerCase()}/meta`,
    });
    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().title).toBe('Banjir Demak 2025');

    const listRes = await server.inject({ method: 'GET', url: '/campaigns/meta' });
    expect(listRes.json().items[CAMPAIGN_ADDR.toLowerCase()].title).toBe('Banjir Demak 2025');
  });

  it('rejects non-owner signature with 403', async () => {
    const timestamp = Date.now();
    const signature = await strangerWallet.signMessage(
      buildCampaignMetaMessage(CAMPAIGN_ADDR, timestamp)
    );

    const postRes = await server.inject({
      method: 'POST',
      url: `/campaigns/${CAMPAIGN_ADDR}/meta`,
      payload: {
        title: 'Hack Title',
        description: 'Unauthorized',
        target: '100',
        imageUrl: '',
        timestamp,
        signature,
      },
    });
    expect(postRes.statusCode).toBe(403);
    expect(postRes.json().error).toBe('BUKAN_OPERATOR');
  });
});
