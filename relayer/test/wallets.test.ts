import { describe, it, expect, beforeEach } from 'vitest';
import { openSqlite } from '../src/db/sqlite.js';
import { keygen, encrypt, decrypt, storeWallet, fetchWallet } from '../src/wallets/custodial.js';
import { loadRelayerEOA } from '../src/wallets/relayer-eoa.js';

const MASTER_KEY = '0x' + 'ab'.repeat(32);

describe('custodial wallets', () => {
  let db: ReturnType<typeof openSqlite>;

  beforeEach(() => {
    db = openSqlite(':memory:');
  });

  it('keygen produces valid Ethereum keypair', () => {
    const { address, privateKey } = keygen();
    expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(privateKey).toMatch(/^0x[0-9a-fA-F]{64}$/);
  });

  it('encrypt → decrypt roundtrip recovers original key', () => {
    const { privateKey } = keygen();
    const enc = encrypt(privateKey, MASTER_KEY);
    const dec = decrypt(enc, MASTER_KEY);
    expect(dec).toBe(privateKey);
  });

  it('storeWallet + fetchWallet roundtrip', () => {
    const { address, privateKey } = keygen();
    const enc = encrypt(privateKey, MASTER_KEY);
    storeWallet(db, '+6281234567890', address, enc);
    expect(fetchWallet(db, '+6281234567890')?.address).toBe(address);
  });

  it('fetchWallet returns undefined for unknown WA', () => {
    expect(fetchWallet(db, '+6289999999999')).toBeUndefined();
  });

  it('storeWallet is idempotent — same WA returns same address', () => {
    const { address, privateKey } = keygen();
    const enc = encrypt(privateKey, MASTER_KEY);
    storeWallet(db, '+6281234567890', address, enc);
    storeWallet(db, '+6281234567890', address, enc);
    expect(fetchWallet(db, '+6281234567890')?.address).toBe(address);
  });
});

describe('relayer EOA', () => {
  it('loads wallet from private key', () => {
    const key = '0x' + '01'.repeat(32);
    const wallet = loadRelayerEOA(key, 'https://sepolia.base.org');
    expect(wallet.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
