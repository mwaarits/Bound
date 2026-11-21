# Spec: Bound — `relayer` module

> Phase 1 output (`spec-driven-development`). Approved map: `CAPABILITY_MAP.md`. Baseline: `prd.md` §4, §6; `CONTEXT.md`; `SPEC-contracts.md` (agent-restricted `belanja`, custodial wallets referenced).

## Assumptions I'm making (correct me now or I'll proceed)

1. **Custody model = server-side custodial keygen, not a WaaS vendor.** PRD §3 table says "custodial embedded (no seed)" for both Penerima and Donatur path-B; the simplest faithful read is the relayer generates keypairs server-side, encrypts at rest, submits txs on the user's behalf. Day-2 swaps to Privy/Magic/Web3Auth — out of MVP.
2. **The relayer EOA is the contract `agent`.** Same EOA used for sponsored-gas `belanja()` submission (BR-10) AND for any on-chain operator-delegated writes. Its ETH balance is the "gas tank" the operator tops up.
3. **Recipient `isPenerima` registration is operator-signed, not relayer-auto.** Relayer creates the custodial wallets and returns addresses; the web app builds a batched `setPenerimaBatch(...)` tx; operator signs **once** with their MetaMask. Cleaner BR-02 analog (operator-only registers) and auditable via `PenerimaDiubah` events. This requires a small addendum to `SPEC-contracts.md` (batch setter) — flagged in Open Questions.
4. **Donatur path-B donasi is submitted by the relayer using the donor's embedded key, gas paid from the embedded wallet's own ETH balance** (BR-10: donor pays own donation tx in both paths). Donor must fund embedded wallet with testnet ETH (Base faucet) AND mIDRX (faucet) before donating.
5. **OTP is mock `123456` for hackathon**, behind a provider interface so a real WhatsApp Business API can drop in day-2.
6. **Whitelist registration stays operator-direct** (operator MetaMask tx via web app, `setWhitelist`). Relayer not involved in store onboarding — matches BR-02.
7. **QR payload is JSON returned by relayer; web renders the QR image** via `qrcode.react` (PRD §6 lists it). Relayer does not generate PNGs.

## Objective

Node.js + ethers backend: the invisible teller of Bound. Five jobs:

1. **OTP login** for Penerima (WA) and Donatur path-B (phone/email) — mock `123456` hackathon, provider-interface for day-2.
2. **Custodial wallets** — auto-generate keypairs for recipients (when operator registers) and donors (when donor picks "no wallet"); WA→wallet map; encrypt at rest; relayer submits on their behalf.
3. **QR registry** — store cashier "Buat QR" requests; issue single-use nonces; enforce 5-minute expiry server-side (defense-in-depth before the contract's on-chain check).
4. **Sponsored-gas `belanja()` submitter** — relayer `agent` EOA signs + submits, gas from operator-funded tank; decode canonical contract errors for the UI.
5. **Donatur path-B `donasi()` submitter** — relayer signs with donor's embedded key, gas from embedded wallet (donor-funded per BR-10).

Why it matters: this is what makes the demo feel like DANA, not MetaMask — Penerima logs in with a phone number and taps Pay, nothing else. The trade-off (custodial trust) is accepted in MVP and stated honestly to judges.

**Module boundary (consumes `contracts`, consumed by `web`):** reads deployed Campaign addresses + ABIs from `contracts/`; exposes a REST API to `web` (auth, wallet lookup, QR create, checkout submit, donor-path-B donate).

## Tech Stack

| Choice | Value | Reason |
|---|---|---|
| Runtime | Node.js 20+ | Standard, ethers-friendly |
| Language | TypeScript (strict) | Type safety on contract bindings + endpoints |
| HTTP | Fastify | Minimal, fast, TS-native |
| ETH lib | ethers v6 | Matches PRD §6; v6 is current |
| DB | SQLite (better-sqlite3) | File-backed, zero-ops, enough for WAL maps + nonce registry at demo scale |
| Auth | JWT (short TTL) | Stateless session for penerima/donor-path-B |
| Key storage | AES-256-GCM encrypted at rest, master key in ENV | Custodial; single point of failure acknowledged (day-2 → MPC/WaaS) |
| QR | payload-only (JSON); `web` renders | Keeps relayer lean; matches PRD §6 `qrcode.react` |
| Tests | Vitest + anvil local fork | Unit + integration against real contracts on fork |

Deliberate non-choices: no WaaS vendor (MVP), no Postgres (overkill), no Redis (overkill), no message queue (sync fine at demo scale).

## Commands

```
Install:    pnpm install
Dev:        pnpm dev                 # Fastify on :4000, hot reload
Build:      pnpm build
Test:       pnpm test                # vitest unit
Test fork:  pnpm test -- --fork-url  # anvil local fork integration
Lint:       pnpm lint
Typecheck:  pnpm typecheck
```

## Project Structure

```
relayer/
  src/
    server.ts                Fastify bootstrap + route registration
    config.ts                ENV parsing (RPC, ADDRESSES, RELAYER_KEY, MASTER_KEY, JWT_SECRET, OTP_MODE)
    auth/
      otp.ts                 OTP provider interface + mock impl (123456)
      jwt.ts                 sign/verify, short TTL
    wallets/
      custodial.ts           keygen, encrypt, store, fetch-by-WA
      relayer-eoa.ts         the agent wallet (gas tank); balance check
    contracts/
      bindings.ts            ethers v6 Contract factories from ABIs (synced from contracts/)
      campaign.ts            typed wrappers: belanja, donasi, setPenerimaBatch, setWhitelist, reads
    qr/
      registry.ts            create QR (nonce+expiry), lookup, consume-on-submit
    submit/
      belanja.ts             sponsored-gas checkout (relayer EOA signs)
      donasi-embedded.ts     donor-path-B donate (donor embedded key signs)
      faucet-embedded.ts     donor-path-B faucet mIDRX (donor embedded key signs; gas from stipend)
    db/
      sqlite.ts              better-sqlite3 open + migrations
      schema.sql             wa_wallets, qr_nonces, gas_tank_ledger
    routes/
      auth.routes.ts         /auth/request-otp, /auth/verify-otp
      recipients.routes.ts   /operator/recipients (create wallets, return addrs for batch tx)
      qr.routes.ts           /store/qr-create (store auth), /penerima/checkout (penerima auth)
donate.routes.ts         /donatur/donate-embedded + /donatur/faucet-embedded (donor-path-B auth)
      health.routes.ts       /health, /gas-tank-balance (operator)
  .env.example                committed template; .env gitignored
  test/
    otp.test.ts
    wallets.test.ts
    qr-registry.test.ts
    belanja.test.ts           fork: success + each BR revert decoded
    donasi-embedded.test.ts
```

## Code Style

TypeScript strict, async/await, ethers v6 patterns. Naming follows `CONTEXT.md` (Indonesian domain concepts in route/param names where user-facing; English internals). No comments unless a rule is cited.

```typescript
// src/submit/belanja.ts — sponsored-gas checkout
export async function submitBelanja(args: {
  penerima: address;
  toko: address;
  jumlah: bigint;
  nonce: bigint;
  expiry: bigint;
}, ctx: Ctx): Promise<{ txHash: string; status: 'ok' | 'revert'; reason?: string }> {
  const { campaign, relayer } = ctx.contracts;
  const qr = await ctx.db.qr.consume(args.nonce);          // single-use, server-side
  if (Date.now() > qr.expiry) return { txHash: '', status: 'revert', reason: 'EXPIRED' };

  try {
    const tx = await campaign.connect(relayer).belanja(
      args.penerima, args.toko, args.jumlah, args.nonce, args.expiry
    );
    const rc = await tx.wait();
    return { txHash: rc.hash, status: 'ok' };
  } catch (e) {
    return { txHash: '', status: 'revert', reason: decodeCanonicalError(e) };
  }
}
// decodeCanonicalError maps ethers revert data -> BUKAN_PENERIMA | BUKAN_WHITELIST | JATAH_HABIS | POOL_HABIS | LIMIT | EXPIRED | NONCE_DIGUNAKAN
```

Conventions: relayer EOA lives in memory (singleton), never logged; every submission logged to `gas_tank_ledger` (txHash, gasCost, kind: belanja|donasi-embedded); JWT 15-min TTL; all endpoints return typed shapes, never raw errors with internals.

## Testing Strategy

Vitest unit + anvil-fork integration. Test plan mirrors contracts BR coverage from the relayer side:

| Concern | Test |
|---|---|
| OTP | mock provider returns `123456` for any known WA; unknown WA → 404 |
| Wallets | keygen produces valid address; encrypt→decrypt roundtrip; WA→wallet lookup |
| QR registry | nonce single-use (second consume fails); expiry enforced server-side before submit |
| `belanja` submit (fork) | success path → event `Belanja` emitted, store funded, `sudahBelanja` updated |
| `belanja` reverts decoded | each of `BUKAN_PENERIMA`, `BUKAN_WHITELIST`, `JATAH_HABIS`, `POOL_HABIS`, `LIMIT`, `EXPIRED`, `NONCE_DIGUNAKAN` surfaces as typed reason |
| `donasi`-embedded | donor embedded wallet signs; gas deducted from embedded ETH balance, not relayer tank |
| faucet-embedded | `mockIDRX.connect(donorKey).faucet()` mints 10M mIDRX to donor's embedded wallet; gas from stipend ETH; `msg.sender` = donor's embedded address |
| Gas tank | balance-read endpoint accurate; ledger entries match submissions |

Coverage expectation: every BR rule has at least one relayer-side test proving the error is surfaced to the UI in canonical form.

## Boundaries

- **Always:** encrypt private keys at rest (AES-256-GCM); never log keys or full JWTs; decode canonical contract errors into Indonesian names for the UI; log every gas-spending submission to `gas_tank_ledger`; expire QR server-side before submitting (defense-in-depth); JWT short TTL.
- **Ask first:** adding a WaaS vendor (Privy/Magic/Web3Auth); swapping OTP provider to WhatsApp Business API; changing custody to MPC/sharded; adding any fiat touch (QRIS, bank payouts); sharing the relayer EOA across campaigns.
- **Never:** commit `.env` or the master key; expose private keys in any response/log; pay donor-path-B gas from the relayer tank (BR-10 — donor pays own donation); reuse the same EOA for unrelated purposes; silently swallow a contract revert (always surface canonical reason).

## Success Criteria

- [ ] Penerima WA OTP login → JWT → wallet lookup → "sisa hak belanja" display, end-to-end on local anvil fork <2s.
- [ ] Store "Buat QR" → Penerima scan → Pay → `belanja()` confirmed on chain, total round-trip <30s (PRD §10).
- [ ] Every BR revert decoded to its canonical Indonesian name and surfaced to web as a typed reason.
- [ ] Donor path-B: OTP login → embedded wallet auto-created → donor funds (faucet) → `donasi()` confirmed, gas paid by embedded wallet.
- [ ] Gas tank balance + ledger visible on `/gas-tank-balance` (operator-only).
- [ ] No private key ever appears in logs, responses, or tests (test fixtures use deterministic anvil accounts).

## Decisions (frozen 2026-11-10, approved by operator)

1. **`setPenerima` on-chain path: operator-signed batch setter** — `setPenerimaBatch(address[], bool[])` on Campaign, `onlyOwner`, emits `PenerimaDiubah` per entry. Relayer creates custodial wallets and returns addresses; web prepays a single batched tx for operator's MetaMask signature. `SPEC-contracts.md` patched accordingly (clean BR-02 analog: operator-only registration, auditable via events).
2. **OTP: mock `123456`** for hackathon, behind a provider interface; real WhatsApp Business API is day-2.
3. **Donor path-B gas funding: relayer auto-stipends 0.001 Sepolia-ETH** to the embedded donor wallet on creation. ETH belongs to the donor's wallet, so the donation tx gas is donor-paid per BR-10 (technically faithful). Donor only faucets mIDRX.
4. **Custody encryption: single ENV master key** (AES-256-GCM), single point of failure stated honestly to judges. Day-2 → MPC sharding or WaaS vendor (Privy/Magic/Web3Auth).
5. **Relayer EOA: one global per relayer instance**, registered as `agent` on every Campaign. Operator tops up once; cross-campaign gas-drain risk accepted for MVP (single-campaign demo).
6. **Faucet-embedded endpoint** (addendum after spec review): `POST /donatur/faucet-embedded` (donor JWT) — relayer submits `MockIDRX.faucet()` signing with the donor's embedded key; gas deducted from the 0.001 Sepolia-ETH stipend credited to the donor wallet on creation (Decision 3). mIDRX credited to donor's embedded wallet; logged to `gas_tank_ledger` (kind=`faucet-embedded`). Same `faucet()` function works for path-A (own-wallet direct) and path-B (relayer-submitted) — `SPEC-contracts.md` Decision 2 confirms `msg.sender` mint pattern.