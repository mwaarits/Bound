# Implementation Plan: Bound — Hackathon Demo Build

> Phase 2 output (`spec-driven-development`; mechanics per `planning-and-task-breakdown`).
> Approved specs: `SPEC-contracts.md`, `SPEC-relayer.md`, `SPEC-web.md` (all decisions frozen 2026-11-21).
> Intent: `docs/intent/hackathon-demo.md` — Indonesian campus Web3 hackathon, solo build (user + agent), live demo day, PRD §9 5-min script.

## Overview

Build Bound's testnet MVP — three modules (`contracts`, `relayer`, `web`) — so the PRD §9 5-minute demo script runs live and clean at the campus hackathon demo day. Vertical slices, each ending in a verification checkpoint; build order `contracts` → `relayer` → `web` with parallelism after contracts deploy.

## Architecture Decisions

- **Vertical slicing** over horizontal: each slice delivers working, testable functionality end-to-end (per `planning-and-task-breakdown` Step 3). Slices T6 (donation own-wallet) and T9 (dashboard) start once contracts deploy, in parallel with relayer T3-T5.
- **Task tracker: `tasks/todo.md`** (default per `planning-and-task-breakdown`; what `/build` expects). PRD §12's file-based `.scratch/bound-mvp/issues/NN-slug.md` tracker is superseded for hackathon velocity — flagged as Open Question Q-1.
- **Git starts in T0.2** — repo is currently not a VCS. Spec/version control starts there; all spec files (already written) get the initial commit.
- **Definition of Done** — per-task acceptance criteria (in `tasks/todo.md`) sit on top of `.opencode/references/definition-of-done.md`; every task clears both before marking complete.

## Task List (index — full detail in `tasks/todo.md`)

### Phase 1: Foundation (T0-T2 — contracts)
- [ ] T0.1 — Monorepo scaffold + pnpm workspace
- [ ] T0.2 — git init + initial commit + .gitignore
- [ ] T1.1 — MockIDRX.sol (ERC20 + faucet)
- [ ] T1.2 — Campaign.sol (state, errors, donasi, belanja, setters, events)
- [ ] T1.3 — CampaignFactory.sol (createCampaign + event)
- [ ] T1.4 — Foundry tests: BR-01..09 + invariants
- [ ] T2.1 — Deploy MockIDRX + CampaignFactory to Base Sepolia (Remix)
- [ ] T2.2 — Create demo campaign; verify source on BaseScan
- [ ] T2.3 — Record addresses in docs/deployments.md

### Checkpoint: Foundation
- [ ] `forge test` green; BR coverage complete
- [ ] Contracts deployed + verified on Base Sepolia; addresses recorded
- [ ] Review with human before proceeding to Phase 2

### Phase 2: Core Features (T3-T9 — relayer + web, partially parallel)
- [ ] T3.1 — Relayer: Fastify + config + SQLite schema
- [ ] T3.2 — Relayer: OTP mock + JWT
- [ ] T3.3 — Relayer: Custodial keygen (AES-GCM) + WA→wallet map
- [ ] T3.4 — Relayer: Contract bindings (ethers v6)
- [ ] T3.5 — Relayer: auth + recipients endpoints
- [ ] T4.1 — Relayer: QR registry (nonce, expiry, single-use)
- [ ] T4.2 — Relayer: belanja submitter + canonical error decode
- [ ] T4.3 — Relayer: store QR-create + penerima checkout endpoints
- [ ] T5.1 — Relayer: donasi-embedded submitter + auto-stipend
- [ ] T5.2 — Relayer: donatur donate-embedded endpoint
- [ ] T5.3 — Relayer: faucet-embedded endpoint (donor-path-B faucet via donor embedded key)
- [ ] T6.1 — Web: Next.js + Tailwind + wagmi/viem scaffold  ← parallel with relayer
- [ ] T6.0 — Web: design-system tokens (`tailwind.config.ts` per `docs/design-system.md` §6) + fonts (Plus Jakarta + JetBrains Mono via next/font) + `BoundWordmark.tsx`  ← blocks T6.3+
- [ ] T6.2 — Web: sync-abis prebuild script
- [ ] T6.3 — Web: donate page own-wallet path
- [ ] T6.4 — Web: donate page embedded path
- [ ] T6.5 — Web: formatIDR + ErrorToast
- [ ] T7.1 — Web: penerima OTP login + sisa display
- [ ] T7.2 — Web: QrScanner (html5-qrcode) + manual-paste fallback
- [ ] T7.3 — Web: Receipt + Pay → relayer checkout
- [ ] T8.1 — Web: toko cashier auth + amount input
- [ ] T8.2 — Web: QrRender (qrcode.react) + /store/qr-create
- [ ] T9.1 — Web: create campaign (factory call)
- [ ] T9.2 — Web: whitelist registration (setWhitelist)
- [ ] T9.3 — Web: recipient batch form → setPenerimaBatch tx
- [ ] T9.4 — Web: delist + limits update
- [ ] T9.5 — Web: public dashboard (pool, history, whitelist via viem getLogs)

### Checkpoint: Core Features
- [ ] Relayer full MVP green on anvil fork (all endpoints, error decode)
- [ ] Web full MVP green locally (local anvil + local relayer)
- [ ] Review with human before proceeding to Phase 3

### Phase 3: Polish & Demo (T10 — rehearsal)
- [ ] T10.1 — Deploy web (Vercel) + relayer (Fly.io/Railway)
- [ ] T10.2 — Playwright e2e: PRD §9 demo script
- [ ] T10.3 — Playwright e2e: negative paths (EXPIRED, BUKAN_PENERIMA, BUKAN_WHITELIST)
- [ ] T10.4 — Real Android phone test (scan-to-confirm <30s)
- [ ] T10.5 — Pre-fund relayer gas tank + demo donors

### Checkpoint: Complete
- [ ] §9 demo script green on deployed stack via real Android
- [ ] All negative paths surface canonical Indonesian errors
- [ ] Ready for demo day

## Parallelization

- **Sequential:** Phase 1 (T0 → T1 → T2) — contracts must deploy before relayer/web integrate.
- **Parallel after T2 (Phase 2):**
  - Track A (relayer): T3 → T4 → T5 (sequential among themselves)
  - Track B (web): T6 (donation, needs contracts only) + T9 (dashboard, needs contracts only) — parallel with Track A
- **Sequential rejoin:** T7, T8 (web) need T4 + T5 (relayer) → wait for Track A.
- **Phase 3:** T10 needs everything → last.

Solo build (user + agent) means parallelism is logical (interleaved sessions), not literal multi-agent. The plan supports either single-agent sequential or future multi-agent split at the Track A/B fork.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Camera permission / html5-qrcode failure on Android | High | Test on real Android in T7.2; manual-paste fallback always available; rehearse permission prompt |
| Venue wifi → RPC latency stalls live demo | High | Relayer on Fly.io public host (not venue laptop); primary Base Sepolia RPC only (Q-3 decision); pre-load dashboard event logs; single-point RPC risk stated honestly to judges (day-2 adds Alchemy/Infura fallback keys) |
| Remix deploy failure on demo day | Med | Deploy ahead in T2; never deploy live on demo day; pre-deployed backup contracts |
| Testnet ETH scarcity for relayer tank | Med | Faucet ahead in T2 prep; fill 0.05+ Sepolia-ETH; gas_tank_ledger monitors burn |
| Scan-to-confirm >30s (PRD §10) | Med | Measure on real Android in T10.4; optimize nonce consume + belanja submit; pre-warm relayer connection |
| Custodial key SPOF (ENV master key) | Low | Disclosed honestly to judges as MVP trade-off; day-2 → MPC/WaaS (per SPEC-relayer Decisions) |
| ABI drift between contracts and web/relayer | Med | sync-abis.ts prebuild hook (T6.2); CI check that ABIs match deployed |
| Donor path-B dual-faucet friction | Low | Relayer auto-stipends 0.001 Sepolia-ETH (SPEC-relayer Decision 3); donor only faucets mIDRX |
| Plus Jakarta heavy weights (400-800) slow first paint on Android | Med | `subsets: ['latin']` + `display:'swap'` + system-ui fallback; verify <1.5s on 4G at T10.4 |
| `html5-qrcode` / `qrcode.react` inline styles conflict with §1.5 shadow-subtle aesthetic | Low | Wrap scanner/render in `rounded-lg overflow-hidden` container per design-system §8 |

## Decisions (frozen 2026-11-21, approved by operator)

- **Q-1 tracker:** `tasks/todo.md` (default; what `/build` expects). PRD §12 file-based `.scratch/bound-mvp/issues/NN-slug.md` superseded for solo-build hackathon velocity; migrate to file-tickets only if multi-agent later.
- **Q-2 relayer demo-day host:** Fly.io primary (deploy in T10.1 prep, persistent public URL + HTTPS). ngrok + venue laptop = plan-B runbook only, documented in `docs/demo-prep.md`.
- **Q-3 Base Sepolia RPC:** Primary `https://sepolia.base.org` only; no Alchemy/Infura fallback for MVP. Single-point RPC risk accepted and stated honestly to judges; day-2 adds fallback API keys.
- **Q-4 demo donor pre-funding:** Pre-fund both donor paths ahead of demo day (T10.5). Path-A: demo MetaMask wallet pre-credited with 10M mIDRX + 0.01 Sepolia-ETH. Path-B: demo embedded wallet (tied to a specific demo phone number) pre-credited with 10M mIDRX + the 0.001 Sepolia-ETH stipend already credited at creation. Faucet remains available as the production-path answer to judges who ask "can I try?", but the demo button flow does not depend on live faucet success.
- **Addendum (faucet-embedded gap closed):** T5.3 added — relayer `/donatur/faucet-embedded` endpoint submits `faucet()` with the donor's embedded key; `SPEC-relayer.md` Decision 6 + project structure / routes / test plan amended; `SPEC-web.md` donate page path-B amended; `SPEC-contracts.md` Decision 2 clarifies faucet mints to `msg.sender` (works for both donor paths without a `faucetTo(address)` variant). Task count updated: 27 → 28.

Tactical, not architectural; none gate Phase 4 implementation start.