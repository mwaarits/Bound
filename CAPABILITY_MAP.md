# Capability Map: Bound

> Approved 2026-11-07 (Phase 0 of `spec-driven-development`; intent: `docs/intent/hackathon-demo.md`).

| Module id | Responsibility | Depends on |
|---|---|---|
| `contracts` | MockIDRX ERC20 + faucet, CampaignFactory, Campaign (pool, `isWhitelist`, `isPenerima`, quota + limits, `donasi()`, `belanja()`, events, no transfer path) | — |
| `relayer` | Node.js + ethers backend: WA-OTP login (mock `123456` then real provider), custodial embedded wallets (WA→wallet map), QR nonce/expiry registry, sponsored-gas `belanja()` submitter, gas tank top-up | `contracts` |
| `web` | Next.js mobile-first: donation page (own-wallet + embedded paths), recipient checkout (scan + manual-paste fallback), store "Create QR", operator setup (whitelist → recipients → limits), public dashboard from chain events | `contracts`, `relayer` |

**Build order:** `contracts` → `relayer` → `web`.

**Module specs:** `SPEC-contracts.md`, `SPEC-relayer.md`, `SPEC-web.md` (project root — this file is the index of what exists; module specs are written in build order, gated on review before the next).

**Global MVP exclusions** (PRD §11): fiat/QRIS/bank rails, in-app swap widget, native mobile, indexer, AA paymaster, IPFS, NIK/DTSEN gov integration, real-money stables.
