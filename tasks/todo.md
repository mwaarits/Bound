# Todo: Bound — Hackathon Demo Build

> Phase 2 task list (`planning-and-task-breakdown` Step 4 structure). Plan index + parallelization + risks in `tasks/plan.md`. Build order `contracts` → `relayer` → `web`.

---

## Phase 1: Foundation

### Task T0.1: Monorepo scaffold + pnpm workspace
**Description:** Create the three-module monorepo layout (contracts/, relayer/, web/) with a root pnpm workspace.
**Acceptance criteria:**
- [x] Root `pnpm-workspace.yaml` lists `contracts`, `relayer`, `web`
- [x] `contracts/` has `foundry.toml` (Solidity ^0.8.24, Base Sepolia config); `lib/` dirs initialized
- [x] `relayer/` has `package.json` (Node 20+, TS strict, Fastify, ethers v6, better-sqlite3)
- [x] `web/` has `package.json` (Next.js 14+, React 18, wagmi v2, viem v2, Tailwind, qrcode.react, html5-qrcode)
- [x] `.env.example` files committed for relayer + web; `.env` gitignored
**Verification:**
- [x] `pnpm install` at root succeeds; all three subdirs resolve (Done in 4m58s; offline re-verify: "Already up to date")
- [x] `forge --version` works in `contracts/` (forge 1.10.0, Commit 083e229941 verified 2026-11-19; required `corepack enable` + `corepack prepare pnpm@9.15.0 --activate` + foundryup install)
**Dependencies:** None
**Files likely touched:** `pnpm-workspace.yaml`, `contracts/foundry.toml`, `relayer/package.json`, `web/package.json`, `.gitignore`, `relayer/.env.example`, `web/.env.example`
**Estimated scope:** M
**Done:** 2026-11-21 — toolchain installed: pnpm 9.15.0 via corepack (matches `packageManager` field), foundry 1.10.0 via foundryup, PATH persisted to `~/.zshrc` + `~/.bashrc`. Fixed `web/package.json` dep error (`@wagmi/connectors@^2.14.0` doesn't exist; wagmi v2 re-exports connectors from `wagmi/connectors`, separate dep removed). pnpm-lock.yaml generated. Peer-dep warnings around eslint v9 vs eslint-config-next 14 (cosmetic, doesn't block build).

### Task T0.2: git init + initial commit + .gitignore
**Description:** Initialize VCS for the repo and commit the specs + scaffold.
**Acceptance criteria:**
- [x] `git init` run; `.gitignore` excludes `node_modules`, `.env`, `.next`, `out`, `cache`, `data/` (agentmemory store), `.opencode/` (already ignored)
- [x] Initial commit includes: `prd.md`, `CONTEXT.md`, `CAPABILITY_MAP.md`, `SPEC-*.md`, `docs/intent/`, `tasks/`, scaffold from T0.1
- [x] Commit message follows convention (e.g., `chore: scaffold Bound monorepo + specs`)
**Verification:**
- [x] `git status` clean after commit
- [x] `git log --oneline` shows one commit
**Dependencies:** T0.1
**Files likely touched:** `.gitignore`, repo root
**Estimated scope:** S
**Done:** 2026-11-21 — commit `4784546` on branch `main`, 30 files, includes pnpm-lock.yaml (10044 lines), all specs + design-system docs. T0.1 + T0.2 folded into one atomic initial commit since the repo wasn't yet a VCS (T0.2's sole purpose is the initial commit of T0.1's scaffolds).

### Task T1.1: MockIDRX.sol (ERC20 + faucet)
**Description:** Implement the mock IDR stable token with a public faucet per SPEC-contracts Decisions.
**Acceptance criteria:**
- [x] ERC20 named "Mock IDRX", symbol `mIDRX`, 18 decimals (1 token = IDR 1)
- [x] `faucet()` mints `10_000_000e18` per call, unlimited calls, public
- [x] Constructor mints initial supply to deployer
- [x] OpenZeppelin ERC20 base; ~10-20 lines of domain logic
**Verification:**
- [x] `forge build` clean
- [x] `MockIDRX.t.sol`: faucet mints correct amount; balance updates; repeat calls allowed; decimals = 18
**Dependencies:** T0.1
**Files likely touched:** `contracts/src/MockIDRX.sol`, `contracts/test/MockIDRX.t.sol`
**Estimated scope:** S
**Done:** 2026-11-21 — commit `969a4b1`. TDD red→green→refactor: 10 tests (name/symbol/decimals/constructor-premint/faucet-amount/unlimited/permissionless/fuzz), 14 LOC source, 100% coverage (lines 4/4, stmts 2/2, funcs 2/2). Constructor premints INITIAL_SUPPLY=1_000_000e18 to deployer (1M IDR seed); faucet() mints FAUCET_AMOUNT=10_000_000e18 per call. Toolchain fix folded in: forge submodules via plain `git submodule add` (forge install fought subdir layout), `.gitignore` un-ignored `contracts/lib/`, remappings added for OZ + forge-std.

### Task T1.2: Campaign.sol (state, errors, donasi, belanja, setters, events)
**Description:** Implement the Campaign contract — pool, whitelist, recipients, quota+limits, donasi, belanja (agent-restricted, expiry+nonce), setters, events, zero transfer path.
**Acceptance criteria:**
- [x] State: `token` (immutable), `agent`, `jatahPerPenerima`, `maxPerTx`, `maxPerHari`, `isWhitelist`, `isPenerima`, `sudahBelanja`, `belanjaHariIni` (per-day), `nonceTerpakai`
- [x] Custom errors exactly named: `BUKAN_PENERIMA`, `BUKAN_WHITELIST`, `JATAH_HABIS`, `POOL_HABIS`, `LIMIT`, `EXPIRED`, `NONCE_DIGUNAKAN`
- [x] `donasi(jumlah)`: transferFrom donor→campaign, emit `Donasi`
- [x] `belanja(penerima, toko, jumlah, nonce, expiry)`: `agent || owner` gated; BR-01..07 checks in order; transfer to `toko`; mark nonce; update `sudahBelanja` + daily; emit `Belanja`
- [x] `setWhitelist(toko, diizinkan)` + `setPenerimaBatch(orang[], diizinkan[])`: `onlyOwner`; emit per-entry events
- [x] `setAgent(addr)`: `onlyOwner`
- [x] BR-08 by construction: no withdraw/transfer path other than `belanja` to whitelisted store
- [x] `Ownable2Step` + `ReentrancyGuard`
**Verification:**
- [x] `forge build` clean
- [x] Compiled artifact size reasonable; no warnings
**Dependencies:** T1.1
**Files likely touched:** `contracts/src/Campaign.sol`
**Estimated scope:** M
**Done:** 2026-11-21 — 3 increments, 3 commits (`e547e46` Inc A setters, `cb22f8f` Inc B donasi, `02d6657` Inc C belanja+BR). 36 tests pass; 100% coverage (40/40 lines, 51/51 stmts, 10/10 branches, 7/7 funcs on Campaign.sol). Constructor: `(operator_, token_, jatahPerPenerima_, maxPerTx_, maxPerHari_)` with `Ownable(operator_)` modifier (OZ 5.x Ownable2Step is abstract; pass via linearized base name in constructor modifier list). Auxiliary non-canonical errors: `BukanAgent` (agent-or-owner auth guard) and `LengthMismatch` (setPenerimaBatch array parity). Spec check order preserved verbatim in belanja (BR-01→07 sequential). Daily counter uses `block.timestamp / 1 days` (UTC, day-2 timezone alignment out of MVP scope per decision).

### Task T1.3: CampaignFactory.sol (createCampaign + event)
**Description:** Factory that deploys Campaign instances with operator-provided parameters.
**Acceptance criteria:**
- [ ] `createCampaign(token, name, jatahPerPenerima, maxPerTx, maxPerHari)` deploys new Campaign with `msg.sender` as operator
- [ ] Emits `CampaignCreated(campaign, operator, token, name, jatah, maxPerTx, maxPerHari)`
- [ ] No on-chain registry storage (event-only discovery per Decision 4)
- [ ] No fee
**Verification:**
- [ ] `forge build` clean
- [ ] Manual: deploy factory → createCampaign → CampaignCreated event emitted with correct params
**Dependencies:** T1.2
**Files likely touched:** `contracts/src/CampaignFactory.sol`
**Estimated scope:** S

### Task T1.4: Foundry tests: BR-01..09 + invariants
**Description:** Full test coverage mapping each business rule to a named test, plus invariant suite.
**Acceptance criteria:**
- [ ] BR-01: outsider `belanja` → `BUKAN_PENERIMA`; valid recipient passes
- [ ] BR-02: non-whitelisted store → `BUKAN_WHITELIST`; listed-then-delisted flow
- [ ] BR-03: beyond quota → `JATAH_HABIS`; beyond pool → `POOL_HABIS`
- [ ] BR-04: `jumlah > maxPerTx` → `LIMIT`
- [ ] BR-05: daily total across txs > `maxPerHari` → `LIMIT`
- [ ] BR-06: past `expiry` → `EXPIRED`
- [ ] BR-07: nonce reuse → `NONCE_DIGUNAKAN`
- [ ] BR-08 invariant: contract token balance decreases only via `Belanja` events to whitelisted stores; no admin withdraw
- [ ] BR-09: delist → in-flight valid-expiry checkout reverts `BUKAN_WHITELIST`
- [ ] Invariants: pool solvency (`balanceOf == totalDonasi − totalBelanja`); `sudahBelanja ≤ jatahPerPenerima`; nonce never repeats
- [ ] Agent-restriction test: non-agent non-owner caller → revert (not a BR but per Decision 1)
**Verification:**
- [ ] `forge test -vvv` all green
- [ ] `forge coverage` touches every BR branch
**Dependencies:** T1.1, T1.2, T1.3
**Files likely touched:** `contracts/test/Campaign.t.sol`, `contracts/test/CampaignFactory.t.sol`, `contracts/test/invariant/`
**Estimated scope:** M

### Task T2.1: Deploy MockIDRX + CampaignFactory to Base Sepolia (Remix)
**Description:** Deploy contracts to Base Sepolia testnet via Remix per PRD §6.
**Acceptance criteria:**
- [ ] MockIDRX deployed; faucet() callable; address recorded
- [ ] CampaignFactory deployed; address recorded
- [ ] Deployer EOA funded with Sepolia-ETH (Base faucet)
**Verification:**
- [ ] Addresses visible on BaseSepolia Etherscan/BaseScan
- [ ] `faucet()` tx confirmed; mIDRX balance visible
**Dependencies:** T1.4
**Files likely touched:** `docs/deployments.md` (new)
**Estimated scope:** S

### Task T2.2: Create demo campaign + verify source on BaseScan
**Description:** Deploy the demo campaign via factory and verify all three contract sources.
**Acceptance criteria:**
- [ ] Campaign "Banjir Demak 2025" created: jatah 500_000e18, maxPerTx 200_000e18, maxPerHari 500_000e18
- [ ] MockIDRX, CampaignFactory, Campaign source-verified on BaseScan
- [ ] Demo relayer EOA generated; set as `agent` via `setAgent`
- [ ] Operator = deployer EOA
**Verification:**
- [ ] BaseScan shows "Contract" tabs with verified source for all three
- [ ] `agent` read returns demo relayer address
**Dependencies:** T2.1
**Files likely touched:** `docs/deployments.md`
**Estimated scope:** S

### Task T2.3: Record addresses + ABIs in docs/deployments.md
**Description:** Persist deployed addresses, ABIs, and demo config for relayer/web integration.
**Acceptance criteria:**
- [ ] `docs/deployments.md` contains: chain (Base Sepolia, chainId 8453), MockIDRX address, CampaignFactory address, demo Campaign address, operator EOA, relayer `agent` EOA, RPC URL
- [ ] ABIs copied to `contracts/out/` (Foundry artifact) and `web/src/abi/` placeholder
- [ ] Demo fixture recipients (Ani/Budi/Citra WA numbers + generated wallet addresses) noted for T9.3
**Verification:**
- [ ] File readable; addresses match BaseScan
- [ ] ABIs parse with `abitype`/ethers
**Dependencies:** T2.2
**Files likely touched:** `docs/deployments.md`
**Estimated scope:** S

### Checkpoint: Foundation
- [ ] `forge test` green; BR coverage complete
- [ ] Contracts deployed + verified on Base Sepolia; addresses + ABIs in `docs/deployments.md`
- [ ] Review with human before proceeding to Phase 2

---

## Phase 2: Core Features (relayer + web, partially parallel)

### Task T3.1: Relayer — Fastify + config + SQLite schema
**Description:** Bootstrap the relayer server: Fastify, ENV config, SQLite open + migrations.
**Acceptance criteria:**
- [ ] `src/server.ts` starts Fastify on :4000 with health route
- [ ] `src/config.ts` parses ENV: `RPC_URL`, `ADDRESSES` (from deployments.md), `RELAYER_KEY`, `MASTER_KEY`, `JWT_SECRET`, `OTP_MODE=mock`
- [ ] `src/db/sqlite.ts` opens better-sqlite3; `schema.sql` creates `wa_wallets`, `qr_nonces`, `gas_tank_ledger`
- [ ] `.env.example` documents all vars
**Verification:**
- [ ] `pnpm dev` starts; `GET /health` returns 200
- [ ] DB file created; tables exist via `sqlite3 .schema`
**Dependencies:** T2.3
**Files likely touched:** `relayer/src/server.ts`, `relayer/src/config.ts`, `relayer/src/db/sqlite.ts`, `relayer/src/db/schema.sql`, `relayer/.env.example`
**Estimated scope:** M

### Task T3.2: Relayer — OTP mock + JWT
**Description:** Auth provider interface + mock impl (123456) + JWT sign/verify.
**Acceptance criteria:**
- [ ] `src/auth/otp.ts`: `OTPProvider` interface (`requestOTP(wa)`, `verifyOTP(wa, code)`); mock impl returns `123456` for any known WA, 404 for unknown
- [ ] `src/auth/jwt.ts`: sign/verify with `JWT_SECRET`, 15-min TTL
- [ ] Routes: `POST /auth/request-otp`, `POST /auth/verify-otp` (returns JWT)
**Verification:**
- [ ] `pnpm test`: known WA → 123456; unknown WA → 404; JWT verifies + expires
**Dependencies:** T3.1
**Files likely touched:** `relayer/src/auth/otp.ts`, `relayer/src/auth/jwt.ts`, `relayer/src/routes/auth.routes.ts`, `relayer/test/otp.test.ts`
**Estimated scope:** S

### Task T3.3: Relayer — custodial keygen (AES-GCM) + WA→wallet map
**Description:** Generate encrypted keypairs server-side; map WA→wallet address.
**Acceptance criteria:**
- [ ] `src/wallets/custodial.ts`: `keygen()` → keypair; `encrypt(privKey, MASTER_KEY)` AES-256-GCM; `decrypt`; store in `wa_wallets` (wa, address, encKey)
- [ ] `fetchWallet(wa)` returns address; private key never leaves decrypt-on-submit
- [ ] `src/wallets/relayer-eoa.ts`: load `RELAYER_KEY`; `getBalance()` for gas tank
**Verification:**
- [ ] `pnpm test`: keygen produces valid address; encrypt→decrypt roundtrip; WA→wallet lookup; balance-read
- [ ] No private key appears in logs or test output (test fixtures use deterministic anvil accounts)
**Dependencies:** T3.1
**Files likely touched:** `relayer/src/wallets/custodial.ts`, `relayer/src/wallets/relayer-eoa.ts`, `relayer/test/wallets.test.ts`
**Estimated scope:** M

### Task T3.4: Relayer — contract bindings (ethers v6)
**Description:** ethers v6 Contract bindings from synced ABIs + typed wrappers.
**Acceptance criteria:**
- [ ] `src/contracts/bindings.ts`: ethers v6 `Contract` factories for MockIDRX, CampaignFactory, Campaign from `contracts/out/` ABIs
- [ ] `src/contracts/campaign.ts`: typed wrappers — `belanja`, `donasi`, `setWhitelist`, `setPenerimaBatch`, reads (`sudahBelanja`, `isPenerima`, `isWhitelist`, pool via `token.balanceOf`)
- [ ] Config injects deployed addresses from `docs/deployments.md`
**Verification:**
- [ ] `pnpm typecheck` clean
- [ ] Unit: read `sudahBelanja(zeroAddr)` returns 0
**Dependencies:** T2.3, T3.1
**Files likely touched:** `relayer/src/contracts/bindings.ts`, `relayer/src/contracts/campaign.ts`
**Estimated scope:** S

### Task T3.5: Relayer — auth + recipients endpoints
**Description:** Operator recipient-registration endpoint: create custodial wallets, return addresses for operator's batched on-chain tx.
**Acceptance criteria:**
- [ ] `POST /operator/recipients` (operator-auth): body `{recipients: [{nama, wa}]}`; creates wallet per WA via T3.3; returns `[{nama, wa, address}]`
- [ ] Operator auth = signed JWT or shared secret (simple for MVP)
- [ ] Response shape ready for web to prep `setPenerimaBatch(addrs[], true[])` tx for MetaMask sign
- [ ] Idempotent: re-POST same WA returns existing address
**Verification:**
- [ ] `pnpm test`: POST 3 recipients → 3 addresses; re-POST same WA → same addresses
**Dependencies:** T3.3, T3.4
**Files likely touched:** `relayer/src/routes/recipients.routes.ts`, `relayer/test/recipients.test.ts`
**Estimated scope:** S

### Task T4.1: Relayer — QR registry (nonce, expiry, single-use)
**Description:** QR issuance + consume store: nonce generation, 5-min expiry, single-use enforcement.
**Acceptance criteria:**
- [ ] `src/qr/registry.ts`: `createQR({campaign, toko, jumlah})` → `{nonce, expiry=now+5min, payload}`; `consumeQR(nonce)` → returns payload or null if already consumed
- [ ] Store in `qr_nonces` (nonce PK, payload, expiry, consumed bool)
- [ ] Expiry enforced server-side before submit (defense-in-depth)
**Verification:**
- [ ] `pnpm test`: create → consume OK; second consume fails; past-expiry create returns expired payload
**Dependencies:** T3.1
**Files likely touched:** `relayer/src/qr/registry.ts`, `relayer/test/qr-registry.test.ts`
**Estimated scope:** S

### Task T4.2: Relayer — belanja submitter + canonical error decode
**Description:** Sponsored-gas `belanja()` submission via relayer `agent` EOA; decode contract custom errors to canonical names.
**Acceptance criteria:**
- [ ] `src/submit/belanja.ts`: `submitBelanja({penerima, toko, jumlah, nonce, expiry})` → consumes QR, submits via `campaign.connect(relayer).belanja(...)`, returns `{txHash, status, reason?}`
- [ ] `decodeCanonicalError(e)`: maps ethers revert data → `BUKAN_PENERIMA | BUKAN_WHITELIST | JATAH_HABIS | POOL_HABIS | LIMIT | EXPIRED | NONCE_DIGUNAKAN`
- [ ] Every submission logged to `gas_tank_ledger` (txHash, gasCost, kind=belanja)
**Verification:**
- [ ] `pnpm test -- --fork-url` (anvil): success → `Belanja` event, store funded, `sudahBelanja` updated
- [ ] Each BR revert surfaces as typed `reason`
**Dependencies:** T3.4, T4.1
**Files likely touched:** `relayer/src/submit/belanja.ts`, `relayer/test/belanja.test.ts`
**Estimated scope:** M

### Task T4.3: Relayer — store QR-create + penerima checkout endpoints
**Description:** HTTP endpoints for store QR creation and penerima checkout submission.
**Acceptance criteria:**
- [ ] `POST /store/qr-create` (store-auth): body `{toko, jumlah}` → creates QR via T4.1, returns `{payload}` for web to render
- [ ] `POST /penerima/checkout` (penerima JWT): body `{payload}` → calls `submitBelanja`, returns `{txHash, status, reason?}`
- [ ] Store auth = JWT or secret per store (simple); penerima auth = T3.2 JWT
**Verification:**
- [ ] `pnpm test`: store creates QR; penerima submits; success + each revert decoded
**Dependencies:** T4.2
**Files likely touched:** `relayer/src/routes/qr.routes.ts`, `relayer/test/checkout.test.ts`
**Estimated scope:** S

### Task T5.1: Relayer — donasi-embedded submitter + auto-stipend
**Description:** Donor path-B: submit `donasi()` with donor's embedded key; auto-stipend Sepolia-ETH on wallet creation.
**Acceptance criteria:**
- [ ] `src/submit/donasi-embedded.ts`: `submitDonasiEmbedded({donorWa, jumlah})` → load donor embedded key, `campaign.connect(donor).donasi(jumlah)`, gas from donor wallet
- [ ] On embedded wallet creation (T3.3 extension): relayer sends 0.001 Sepolia-ETH from relayer EOA to new donor wallet
- [ ] Logged to `gas_tank_ledger` (kind=stipend on creation, kind=donasi-embedded on donate — note: donasi gas is donor-paid, but stipend is relayer-funded BR-10-adjacent)
**Verification:**
- [ ] `pnpm test -- --fork-url`: donor OTP login → embedded wallet created + stipend received → faucet mIDRX → donasi confirmed, gas from embedded balance
**Dependencies:** T3.3, T3.4
**Files likely touched:** `relayer/src/submit/donasi-embedded.ts`, `relayer/src/wallets/custodial.ts` (stipend hook)
**Estimated scope:** M

### Task T5.2: Relayer — donatur donate-embedded endpoint
**Description:** HTTP endpoint for donor path-B donation.
**Acceptance criteria:**
- [ ] `POST /donatur/donate-embedded` (donor JWT): body `{jumlah}` → calls `submitDonasiEmbedded`, returns `{txHash, status, reason?}`
- [ ] Donor JWT from T3.2 (phone/email OTP login)
**Verification:**
- [ ] `pnpm test`: donor donates via endpoint; pool increases; `Donasi` event emitted
**Dependencies:** T5.1
**Files likely touched:** `relayer/src/routes/donate.routes.ts`, `relayer/test/donasi-embedded.test.ts`
**Estimated scope:** S

### Task T5.3: Relayer — faucet-embedded endpoint (donor-path-B faucet)
**Description:** Donor path-B faucet: relayer submits `MockIDRX.faucet()` signing with the donor's embedded key; gas deducted from the 0.001 Sepolia-ETH stipend credited on wallet creation (T5.1). mIDRX credited to donor's embedded wallet. Closes the gap discovered during Q-4 review.
**Acceptance criteria:**
- [ ] `src/submit/faucet-embedded.ts`: `submitFaucetEmbedded({donorWa})` → load donor embedded key → `mockIDRX.connect(donorKey).faucet()` → return `{txHash, amount: 10_000_000e18}`
- [ ] `POST /donatur/faucet-embedded` (donor JWT) wired in `donate.routes.ts`
- [ ] Gas deducted from donor's embedded ETH balance (stipend), not relayer tank
- [ ] mIDRX (10M) credited to donor's embedded wallet address
- [ ] Logged to `gas_tank_ledger` (kind=`faucet-embedded`) for audit
**Verification:**
- [ ] `pnpm test -- --fork-url` (anvil): donor embedded wallet has 0 mIDRX → POST faucet-embedded → 10M mIDRX credited; gas from stipend balance; tx confirmed
**Dependencies:** T5.1
**Files likely touched:** `relayer/src/submit/faucet-embedded.ts`, `relayer/src/routes/donate.routes.ts`, `relayer/test/faucet-embedded.test.ts`
**Estimated scope:** S

### Task T6.1: Web — Next.js + Tailwind + wagmi/viem scaffold  (parallel track B)
**Description:** Next.js App Router + TS strict + Tailwind + wagmi v2 + viem v2 scaffold.
**Acceptance criteria:**
- [ ] `web/` runs `pnpm dev` on :3000
- [ ] `src/lib/wagmi-config.ts`: chain=`baseSepolia`, connectors=[`metaMask`]
- [ ] `src/lib/viem-client.ts`: public client for Base Sepolia (primary `https://sepolia.base.org` only; no fallback per Q-3 decision)
- [ ] `src/app/layout.tsx`: WagmiProvider + relayer-client provider + base mobile shell
- [ ] `tailwind.config.ts` mobile-first scaffold (default tokens only — full design-system tokens per `docs/design-system.md` §6 added in T6.0); `src/app/globals.css` base
- [ ] Addresses from `docs/deployments.md` injected via ENV
- [ ] `tailwind.config.ts` `theme.extend` tokens copied verbatim from `docs/design-system.md` §6 (colors, fontFamily, fontSize, borderRadius, boxShadow — no off-scale values, no purple/indigo, no `rounded-2xl`)
- [ ] `src/app/globals.css` adds `.text-numeric-ledger`, `.text-numeric-penerima` utilities + focus-visible base layer (`:focus-visible { outline: none; box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #047857; }`) per design-system §6
- [ ] `src/app/layout.tsx` wires `next/font/google`: Plus Jakarta Sans (weights 400/500/600/700/800, `variable: '--font-plus-jakarta'`, `display:'swap'`, subsets `latin`) + JetBrains Mono (weights 400/500, `variable: '--font-jetbrains-mono'`); CSS variables exposed on `<html>`
- [ ] `src/components/BoundWordmark.tsx` scaffolded: lowercase "bound", Plus Jakarta ExtraBold 800, tracking `-0.02em`, `<a href="/" aria-label="Bound home">` (becomes `<span>` on `/` route — no self-link), color flips (black `text-primary` on light, white `text-on-dark` on `bg-chrome-dark`), no symbol/period/emoji/dot
**Verification:**
- [ ] `pnpm dev` boots; `/` loads without wallet connected
- [ ] `pnpm typecheck` clean
**Dependencies:** T2.3
**Files likely touched:** `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/lib/wagmi-config.ts`, `web/src/lib/viem-client.ts`, `web/src/lib/relayer-client.ts`, `web/tailwind.config.ts`, `web/next.config.mjs`
**Estimated scope:** M

### Task T6.0: Web — design-system tokens + fonts + BoundWordmark
**Description:** Fill `web/tailwind.config.ts` with the binding tokens from `docs/design-system.md` §6 (colors, fontFamily, fontSize scale incl. `display-xl`/`numeric-ledger`/`numeric-penerima`, radius, boxShadow), wire Plus Jakarta Sans (400/500/600/700/800) and JetBrains Mono (400/500) via `next/font/google` into `src/app/layout.tsx` with `--font-plus-jakarta` and `--font-jetbrains-mono` CSS variables + `display: 'swap'`, add globals.css layer for `.text-numeric-ledger`/`.text-numeric-penerima` (tnum) and the base `:focus-visible` ring, and ship `web/src/components/BoundWordmark.tsx` per design-system §4 (lowercase "Bound", Plus Jakarta 800, -0.02em, `<a href="/" aria-label="Bound home">` with black-on-light / white-on-dark color flip, `<span>` form on home route).
**Acceptance criteria:**
- [ ] `web/tailwind.config.ts` `theme.extend` matches `docs/design-system.md` §6 exact tokens (`colors.bg-base`/`bg-surface`/`bg-surface-emerald`/`bg-surface-saffron`/`bg-chrome-dark`/`text-primary`/`text-secondary`/`text-on-dark`/`brand-primary`/`brand-primary-deep`/`brand-surface`/`success`/`success-text`/`error`/`error-action`/`border-subtle`/`border-ledger`/`focus-ring`; `fontFamily.sans`/`mono`; `fontSize.[display-xl..numeric-penerima]`; `borderRadius[none/sm/default/md/lg/xl/full]`; `boxShadow[none/xs/sm/md]`)
- [ ] `web/src/app/globals.css` declares `.text-numeric-ledger { font-feature-settings: 'tnum' 1; font-family: var(--font-jetbrains-mono), ui-monospace, monospace; }`, `.text-numeric-penerima { font-feature-settings: 'tnum' 1; }`, and base layer `:focus-visible { outline: none; box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #047857; }`
- [ ] `web/src/app/layout.tsx` imports `Plus_Jakarta_Sans` + `JetBrains_Mono` from `next/font/google`, sets `subsets: ['latin']`, weights per design-system §1.2, exposes CSS variables via `variable` prop, applies both variables to the root `<html>` className
- [ ] `web/src/components/BoundWordmark.tsx` renders lowercase "Bound" (no period, no symbol) in Plus Jakarta 800 with `-0.02em` tracking; default color `text-text-primary` (black); accepts `onDark?: boolean` prop → `text-text-on-dark` (white); renders as `<a>` on non-home route, `<span>` when `asHome` prop is true; size scales per design-system §4 (28px<768, 36px≥768, 40px≥1024 via Tailwind responsive utilities)
- [ ] No off-scale values anywhere; no `rounded-2xl` (anti-AI-aesthetic); no purple/indigo colors
**Verification:**
- [ ] `pnpm dev` boots, `/` shows lowercase "Bound" wordmark in Plus Jakarta 800 (not system fallback), FOUT éviter — DevTools Network shows font loaded
- [ ] `pnpm typecheck` clean
- [ ] Manual: Tab through a temporary scaffold button → focus-visible ring is white-on-emerald-700 2px-offset-2px (per §1.6)
- [ ] Manual: token legend page (temporary `/tokens` route, deleted before commit) renders all color swatches; visually inspect saffron is fill-only flagged, emerald-700 used for text, no prohibited pairs present
- [ ] WCAG spot-check: browser DevTools → contrast on `text-brand-primary` link vs white = 4.88:1 (expected); on saffron fill with black = 10.1:1 (expected)
**Dependencies:** T6.1
**Files likely touched:** `web/tailwind.config.ts`, `web/src/app/globals.css`, `web/src/app/layout.tsx`, `web/src/components/BoundWordmark.tsx`
**Estimated scope:** S

### Task T6.2: Web — sync-abis prebuild script
**Description:** Prebuild script copying ABIs from `contracts/out/` to `web/src/abi/`.
**Acceptance criteria:**
- [ ] `web/scripts/sync-abis.ts`: reads `contracts/out/MockIDRX.sol/MockIDRX.json` (etc.), extracts `.abi`, writes to `web/src/abi/{MockIDRX,Campaign,CampaignFactory}.abi.ts`
- [ ] Wired as `prebuild` npm script; also runnable via `pnpm sync-abis`
- [ ] `web/src/abi/` gitignored (generated); types committed
**Verification:**
- [ ] `pnpm sync-abis` produces 3 abi files; `pnpm build` succeeds
**Dependencies:** T1.4, T6.1
**Files likely touched:** `web/scripts/sync-abis.ts`, `web/package.json` (prebuild hook)
**Estimated scope:** S

### Task T6.3: Web — donate page own-wallet path
**Description:** Donation page path A: connect MetaMask → faucet → approve → donasi.
**Acceptance criteria:**
- [ ] `src/app/campaign/[addr]/donate/page.tsx`: path switcher (own-wallet | embedded)
- [ ] Own-wallet path: WalletConnect button → "Faucet 10M mIDRX" (calls MockIDRX.faucet) → "Approve" (ERC20 approve) → "Donate" (campaign.donasi)
- [ ] Tx status feedback; success → "Pool updated" + event visible
**Verification:**
- [ ] Local anvil: own-wallet donation completes; pool increases; `Donasi` event read via viem
**Dependencies:** T6.1, T6.2
**Files likely touched:** `web/src/app/campaign/[addr]/donate/page.tsx`, `web/src/components/DonateForm.tsx`, `web/src/components/WalletConnect.tsx`
**Estimated scope:** M

### Task T6.4: Web — donate page embedded path
**Description:** Donation page path B: OTP → auto-wallet → stipend+faucet → donasi via relayer.
**Acceptance criteria:**
- [ ] Embedded path: phone/email OTP (POST /auth/request-otp, /verify-otp) → display embedded wallet address (relayer-created + 0.001 ETH stipend credited) → "Faucet mIDRX" (POST `/donatur/faucet-embedded` — relayer signs `faucet()` with donor's embedded key) → "Donate" (POST `/donatur/donate-embedded`)
- [ ] Wallet address visible to donor after creation
- [ ] Faucet confirmation required before "Donate" button becomes active
- [ ] Tx status feedback for both faucet and donate steps
**Verification:**
- [ ] Local: embedded path completes (needs relayer T5.2 running); pool increases
**Dependencies:** T6.3, T5.2
**Files likely touched:** `web/src/app/campaign/[addr]/donate/page.tsx`, `web/src/components/DonateForm.tsx`
**Estimated scope:** M

### Task T6.5: Web — formatIDR + ErrorToast
**Description:** Amount formatting utility + canonical error renderer.
**Acceptance criteria:**
- [ ] `src/lib/format.ts`: `formatIDR(bigint)` → "Rp 500.000"; edge 0 → "Rp 0"
- [ ] `src/components/ErrorToast.tsx`: maps canonical error name → Indonesian label (`BUKAN_PENERIMA` → "Bukan penerima terdaftar", etc.)
- [ ] Used across pages
- [ ] `ErrorToast` semantics per design-system §3: `role="status"` + `aria-live="polite"` for non-critical, `role="alert"` for blocking (Pay failed mid-tx)
- [ ] `ErrorToast`: 5s auto-dismiss with `aria-label="Tutup"` close button keyboard-reachable; never color-only (icon + word + tone: red + warning triangle + canonical Indonesian verb-noun)
- [ ] `formatIDR` usable with both `text-numeric-ledger` (judge) and `text-numeric-penerima` (Penerima) font classes
**Verification:**
- [ ] `pnpm test`: formatIDR cases; error map complete (all 7 canonical names)
**Dependencies:** T6.1
**Files likely touched:** `web/src/lib/format.ts`, `web/src/components/ErrorToast.tsx`, `web/test/unit/format.test.ts`
**Estimated scope:** S

### Task T7.1: Web — penerima OTP login + sisa display
**Description:** Recipient page: WA OTP login → display "sisa hak belanja".
**Acceptance criteria:**
- [ ] `src/app/penerima/page.tsx`: WA input → OTP (mock 123456) → JWT → fetch wallet → read `sudahBelanja` + `jatahPerPenerima` → display `jatah - sudahBelanja` formatted IDR
- [ ] Logout; JWT refresh
- [ ] Amount rendered with `text-numeric-penerima` (24px Plus Jakarta tabular, NOT mono) per design-system §2.1
- [ ] "Habis" state: 0 amount + `text-secondary` + word "Habis" (never zero-as-only-signal)
- [ ] Loading skeleton sized to `text-numeric-penerima` block
- [ ] Body min `text-body-lg` (18px); no `text-body-sm` or `text-caption` on Penerima surface per design-system §2.1
**Verification:**
- [ ] Local: Ani logs in → sees "Sisa hak belanja: Rp 500.000"
**Dependencies:** T6.1, T3.2
**Files likely touched:** `web/src/app/penerima/page.tsx`, `web/src/components/SisaHakBelanja.tsx`, `web/src/hooks/useSisaHakBelanja.ts`
**Estimated scope:** M

### Task T7.2: Web — QrScanner (html5-qrcode) + manual-paste fallback
**Description:** Camera QR scanner with manual-paste fallback.
**Acceptance criteria:**
- [ ] `src/components/QrScanner.tsx`: html5-qrcode camera scan → parse QR payload JSON ({campaign, toko, namaToko, jumlah, nonce, expiry})
- [ ] Manual-paste input (textarea) as fallback (PRD §6)
- [ ] Camera permission prompt handled gracefully; fallback button visible
**Verification:**
- [ ] Camera scan + paste both produce same `QrPayload` shape
- [ ] Real Android browser test (T10.4) — but here: local desktop camera works
**Dependencies:** T7.1
**Files likely touched:** `web/src/components/QrScanner.tsx`
**Estimated scope:** S

### Task T7.3: Web — Receipt + Pay → relayer checkout
**Description:** Scan-result review + Pay → relayer /penerima/checkout.
**Acceptance criteria:**
- [ ] `src/components/Receipt.tsx`: display `{jumlah, namaToko}`, expiry check, "Bayar" button → POST /penerima/checkout
- [ ] On `status: 'ok'` → success screen; on `status: 'revert'` → ErrorToast with `reason`
- [ ] On success: redirect to sisa display showing decreased amount
- [ ] Amount `text-numeric-penerima` 24px; Pay button `text-display-md` 32px + `min-h-[48px]` (WCAG 2.2 AAA) per design-system §3
- [ ] Expired state = red ring + clock icon + word "Kedaluwarsa" double-encoded; success = "Dibayar" pill: `bg-success` (saffron fill) + black "Dibayar" text + checkmark icon
- [ ] Body min `text-body-lg`; no `text-body-sm`/`text-caption`
**Verification:**
- [ ] Local: Ani scans 50K → Pay → store funded, sisa drops 50K, history event; expired QR → EXPIRED toast
**Dependencies:** T7.2, T4.3
**Files likely touched:** `web/src/components/Receipt.tsx`, `web/src/app/penerima/page.tsx`
**Estimated scope:** S

### Task T8.1: Web — toko cashier auth + amount input
**Description:** Store page: cashier auth + amount entry.
**Acceptance criteria:**
- [ ] `src/app/toko/page.tsx`: cashier login (JWT or secret) → amount input (IDR) → "Buat QR"
- [ ] Amount validated (positive integer)
**Verification:**
- [ ] Local: cashier logs in, enters 50000, proceeds to QR
**Dependencies:** T6.1
**Files likely touched:** `web/src/app/toko/page.tsx`
**Estimated scope:** S

### Task T8.2: Web — QrRender (qrcode.react) + /store/qr-create
**Description:** Store QR creation: POST to relayer, render QR image.
**Acceptance criteria:**
- [ ] `src/components/QrRender.tsx`: qrcode.react renders QR from payload JSON
- [ ] T8.1 "Buat QR" calls POST /store/qr-create → receives payload → renders QR
- [ ] QR displays on store device; visible to recipient scan
- [ ] `<canvas role="img" alt="QR code untuk toko {namaToko}">` semantic + alt text per design-system §3
- [ ] Loading skeleton canvas placeholder; error state never blank (ErrorToast `BUKAN_TOKO`)
- [ ] Pure black-on-white QR default; revisit per-route in T6.x if chrome-dark context per design-system §8
**Verification:**
- [ ] Local: cashier creates 50K QR; QR renders; recipient (T7) can scan it successfully
**Dependencies:** T8.1, T4.3
**Files likely touched:** `web/src/components/QrRender.tsx`, `web/src/app/toko/page.tsx`
**Estimated scope:** S

### Task T9.1: Web — create campaign (factory call)
**Description:** Operator dashboard: create campaign via factory.
**Acceptance criteria:**
- [ ] `src/app/campaign/[addr]/page.tsx` operator section: "Buat Kampanye" form → wagmi write to CampaignFactory.createCampaign
- [ ] Form fields: name, jatah, maxPerTx, maxPerHari (IDR)
- [ ] On success: redirect to new campaign dashboard
**Verification:**
- [ ] Local: operator creates "Banjir Demak 2025"; CampaignCreated event; dashboard loads
**Dependencies:** T6.1, T1.3
**Files likely touched:** `web/src/app/campaign/[addr]/page.tsx`, `web/src/components/CreateCampaignForm.tsx`
**Estimated scope:** M

### Task T9.2: Web — whitelist registration (setWhitelist)
**Description:** Operator: register stores via setWhitelist.
**Acceptance criteria:**
- [ ] Form: store name + wallet address → wagmi write to campaign.setWhitelist(addr, true)
- [ ] WhitelistTable component reads isWhitelist via viem; delist button → setWhitelist(addr, false)
- [ ] Events: WhitelistDiubah reflected in table
- [ ] `<table>` with `<thead>` semantic; ledger line 1px `border-ledger` between rows per design-system §3
- [ ] Delist `<button>` with `aria-label="Hapus {namaToko} dari whitelist"` + trash icon
- [ ] Status column: icon + word "Aktif"/"Dihapus" not color-only per design-system §3
**Verification:**
- [ ] Local: register 2 demo stores; table updates; delist one; table updates
**Dependencies:** T9.1
**Files likely touched:** `web/src/components/WhitelistTable.tsx`, `web/src/app/campaign/[addr]/page.tsx`
**Estimated scope:** S

### Task T9.3: Web — recipient batch form → setPenerimaBatch tx
**Description:** Operator: paste recipient list → create wallets via relayer → prep setPenerimaBatch tx for MetaMask sign.
**Acceptance criteria:**
- [ ] `RecipientBatchForm`: textarea `{nama, WA}` lines → POST /operator/recipients (T3.5) → relayer returns addresses → prep `setPenerimaBatch(addrs[], true[])` tx → operator MetaMask sign 1x
- [ ] On success: recipients displayed with wallet addresses
**Verification:**
- [ ] Local: paste Ani/Budi/Citra → wallets created → one MetaMask tx → isPenerima true for all 3
**Dependencies:** T9.2, T3.5
**Files likely touched:** `web/src/components/RecipientBatchForm.tsx`, `web/src/app/campaign/[addr]/page.tsx`
**Estimated scope:** M

### Task T9.4: Web — delist + limits update UI
**Description:** Operator: delist stores (from T9.2) + update limits (maxPerTx, maxPerHari).
**Acceptance criteria:**
- [ ] Limit-update form → wagmi write to campaign.setLimit (or similar setter — confirm exists in T1.2; if not, add small setter)
- [ ] Delist button already in T9.2; ensure limits + delist coexist in operator section
**Verification:**
- [ ] Local: update maxPerTx → read reflects new value; delist store → table + checkout revert
**Dependencies:** T9.2
**Files likely touched:** `web/src/app/campaign/[addr]/page.tsx`, (maybe `contracts/src/Campaign.sol` if setter missing)
**Estimated scope:** S

### Task T9.5: Web — public dashboard (pool, history, whitelist via viem getLogs)
**Description:** Public dashboard reading chain events directly via viem (no indexer per Decision 5).
**Acceptance criteria:**
- [ ] `PoolCard`: reads `mockIDRX.balanceOf(campaign)` → displays pool total
- [ ] `HistoryFeed`: viem `getLogs` for `Donasi` + `Belanja` events → chronological list (donatur/penerima/toko/amount)
- [ ] `WhitelistTable` (public read-only view): active stores from `WhitelistDiubah` log reduce
- [ ] All reads browser-side via viem publicClient; no relayer cache
- [ ] `PoolCard` both amounts `text-numeric-ledger` (JetBrains Mono tabular); progress bar `<div role="progressbar" aria-valuenow/min/max>`; ratio label "Terkumpul / Target" below bar (color bar not sole signal)
- [ ] `HistoryFeed` ledger line 1px `border-ledger` between rows (`<table>` or `<ol role="list">`)
- [ ] Each history row: timestamp + amount (`text-numeric-ledger`) + type icon + word ("Donasi"/"Belanja"); settled badge on belanja rows: saffron fill + black "Dibayar" text + checkmark icon per design-system §3
**Verification:**
- [ ] Local: after T6.3 donation + T7.3 spend, dashboard shows pool, history, whitelist updated
**Dependencies:** T9.1, T6.2
**Files likely touched:** `web/src/components/PoolCard.tsx`, `web/src/components/HistoryFeed.tsx`, `web/src/hooks/useCampaignLogs.ts`
**Estimated scope:** M

### Checkpoint: Core Features
- [ ] Relayer full MVP green on anvil fork (all endpoints, error decode, BR coverage)
- [ ] Web full MVP green locally (local anvil + local relayer): all four pages work
- [ ] Review with human before proceeding to Phase 3

---

## Phase 3: Polish & Demo

### Task T10.1: Deploy web (Vercel) + relayer (Fly.io/Railway)
**Description:** Deploy the full stack to public hosts for demo day.
**Acceptance criteria:**
- [ ] Web deployed to Vercel; public URL reachable
- [ ] Relayer deployed to Fly.io (primary per Q-2); persistent public URL + HTTPS; relayer ENV (`RELAYER_KEY`, `MASTER_KEY`, `JWT_SECRET`, `ADDRESSES`, `RPC_URL`) set
- [ ] Plan-B: ngrok + venue laptop runbook documented in `docs/demo-prep.md` (backup only, not primary)
- [ ] Web ENV: `NEXT_PUBLIC_RELAYER_URL` + `NEXT_PUBLIC_CONTRACT_ADDRESSES` + `NEXT_PUBLIC_RPC_URL` set
- [ ] Cross-origin: relayer CORS allows Vercel domain
**Verification:**
- [ ] Vercel web loads; can connect MetaMask to Base Sepolia
- [ ] Relayer `/health` reachable from browser
**Dependencies:** All Phase 2 (T3-T9)
**Files likely touched:** `web/vercel.json` (if needed), `relayer/Dockerfile` + `fly.toml`, deploy configs
**Estimated scope:** M

### Task T10.2: Playwright e2e — PRD §9 demo script
**Description:** End-to-end test running the full 5-minute demo choreography.
**Acceptance criteria:**
- [ ] `test/e2e/demo-script.spec.ts`: faucet + donate 10M → Ani scan 50K → store funded, sisa −50K, pool −50K, history event
- [ ] Negative 1: no send-to-friend path exists in UI (assert absence)
- [ ] Negative 2: yesterday's QR (expired) → `EXPIRED` toast
- [ ] Negative 3: random outsider scan → `BUKAN_PENERIMA` toast
- [ ] Negative 4: delisted store checkout → `BUKAN_WHITELIST` toast
- [ ] Runs against deployed stack (Vercel + Fly relayer + Base Sepolia)
- [ ] `@axe-core/playwright` integrated; assertions: zero axe violations per page
- [ ] Keyboard Tab order asserts: matches visual order on each page
- [ ] Focus-visible ring presence: every interactive element shows ring on keyboard focus
- [ ] Status-not-color-only assertion: every state has icon + word + tone, not just color per design-system §5.4
**Verification:**
- [ ] `pnpm test:e2e` green end-to-end on deployed stack
**Dependencies:** T10.1
**Files likely touched:** `web/test/e2e/demo-script.spec.ts`, `web/test/e2e/negative-paths.spec.ts`, `web/playwright.config.ts`
**Estimated scope:** L

### Task T10.3: Playwright e2e — negative paths
**Description:** Explicit negative-path test coverage (folded into T10.2 if same spec; separate file if cleaner).
**Acceptance criteria:**
- [ ] All four negative paths from §9 assert canonical Indonesian error labels visible in UI
**Verification:**
- [ ] `pnpm test:e2e` green; negative specs pass
**Dependencies:** T10.2
**Files likely touched:** `web/test/e2e/negative-paths.spec.ts`
**Estimated scope:** S

### Task T10.4: Real Android phone test (scan-to-confirm <30s)
**Description:** Manual + scripted test on a real Android device via the deployed stack.
**Acceptance criteria:**
- [ ] Penerima login on Android Chrome → OTP → sisa display legible
- [ ] Camera scan works (html5-qrcode) on Android; permission prompt graceful
- [ ] Scan-to-confirm (scan → Pay → on-chain confirm) <30s end-to-end (PRD §10)
- [ ] Manual-paste fallback works if camera fails
- [ ] All tap targets sized for thumb; mobile-first legibility
- [ ] Body ≥18px (`text-body-lg`) renders no vertical overflow on 5" Android viewport
- [ ] Tap targets ≥48×48px verified on every Penerima-facing interactive element (WCAG 2.2 AAA)
- [ ] Plus Jakarta heavy weights (400-800) load <1.5s under 4G network throttle per design-system §7
- [ ] `html5-qrcode` inline-style conflict contained: scanner wrapped in `rounded-lg overflow-hidden` container per design-system §8
**Verification:**
- [ ] Run §9 demo script on real Android; timing logged
- [ ] If >30s: optimize (nonce consume, RPC, relayer connection) and re-measure
**Dependencies:** T10.1
**Files likely touched:** None (manual); maybe perf tweaks in QrScanner/Receipt
**Estimated scope:** S

### Task T10.5: Pre-fund relayer gas tank + demo donors
**Description:** Pre-fill relayer gas tank and demo donor wallets so demo doesn't depend on live faucet.
**Acceptance criteria:**
- [ ] Relayer `agent` EOA funded with 0.05+ Sepolia-ETH (covers hundreds of checkouts)
- [ ] Path-A demo donor MetaMask wallet pre-funded with 10M mIDRX + 0.01 Sepolia-ETH (so own-wallet demo donate works without live faucet)
- [ ] Path-B demo donor embedded wallet (tied to a specific demo phone number, pre-seeded in relayer DB) pre-funded with 10M mIDRX + 0.001 Sepolia-ETH stipend already credited at creation
- [ ] Faucet remains available as the production path (judges who ask "can I try?" can run it) but the demo donor button flow does not depend on live faucet success
- [ ] Demo fixture recipients (Ani/Budi/Citra) wallets confirmed on-chain as `isPenerima`
- [ ] `gas_tank_ledger` baseline recorded; pre-funding tx hashes logged in `docs/demo-prep.md`
**Verification:**
- [ ] `/gas-tank-balance` (operator-only) shows >0.05 ETH
- [ ] Demo donors' balances visible on BaseScan
**Dependencies:** T10.1
**Files likely touched:** `docs/demo-prep.md` (runbook)
**Estimated scope:** S

### Checkpoint: Complete
- [ ] §9 demo script green on deployed stack (Vercel + Fly + Base Sepolia) via real Android
- [ ] Scan-to-confirm <30s
- [ ] All negative paths surface canonical Indonesian errors
- [ ] Pre-funded; no live faucet dependency for demo donors
- [ ] Ready for demo day

---

## Cross-cutting notes

- **Per-task Definition-of-Done** (`.opencode/references/definition-of-done.md`) applies on top of each task's acceptance criteria.
- **Implementation skills** (Phase 4): `incremental-implementation` + `test-driven-development` per task; `context-engineering` to load spec sections per step.
- **Commits:** one commit per task (or per verifiable sub-step); never commit secrets/`.env`; commit messages follow `git-workflow-and-versioning` convention.