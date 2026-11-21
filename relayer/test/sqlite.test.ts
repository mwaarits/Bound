import { describe, it, expect, beforeEach } from 'vitest';
import { openSqlite } from '../src/db/sqlite.js';

describe('sqlite schema', () => {
  let db: ReturnType<typeof openSqlite>;

  beforeEach(() => {
    db = openSqlite(':memory:');
  });

  it('creates wa_wallets with expected columns', () => {
    const cols = db.prepare('PRAGMA table_info(wa_wallets)').all().map(c => c.name);
    expect(cols).toEqual(['wa', 'address', 'enc_priv_key', 'created_at']);
  });

  it('creates qr_nonces with expected columns', () => {
    const cols = db.prepare('PRAGMA table_info(qr_nonces)').all().map(c => c.name);
    expect(cols).toEqual(['nonce', 'payload', 'expiry', 'consumed']);
  });

  it('creates gas_tank_ledger with expected columns', () => {
    const cols = db.prepare('PRAGMA table_info(gas_tank_ledger)').all().map(c => c.name);
    expect(cols).toEqual(['id', 'kind', 'tx_hash', 'gas_cost_gwei', 'created_at']);
  });
});
