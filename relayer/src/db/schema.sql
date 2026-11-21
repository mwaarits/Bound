CREATE TABLE IF NOT EXISTS wa_wallets (
  wa          TEXT PRIMARY KEY,
  address     TEXT NOT NULL UNIQUE,
  enc_priv_key TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS qr_nonces (
  nonce      INTEGER PRIMARY KEY,
  payload    TEXT NOT NULL,
  expiry     INTEGER NOT NULL,
  consumed   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gas_tank_ledger (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  kind          TEXT NOT NULL CHECK (kind IN ('belanja','donasi-embedded','faucet-embedded','stipend')),
  tx_hash       TEXT,
  gas_cost_gwei INTEGER,
  created_at    INTEGER NOT NULL
);
