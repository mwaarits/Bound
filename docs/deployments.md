# Bound — Deployments

> Addresses + ABIs recorded here after each Base Sepolia deploy.
> Runbook: `docs/demo-prep.md`. Spec: `SPEC-contracts.md`.

## Base Sepolia (chainId 8453)

| Label | Address | Deployed | Source verified | Notes |
|---|---|---|---|---|
| MockIDRX | TBD | TBD | TBD | ERC20 faucet, 18 decimals, 1 token = IDR 1 |
| CampaignFactory | TBD | TBD | TBD | `createCampaign(...)` → Campaign; event-only discovery |
| Campaign (Banjir Demak 2025) | TBD | TBD | TBD | jatah 500K, maxPerTx 200K, maxPerHari 500K |
| Operator EOA | TBD | — | — | Bound Operator MetaMask account; owner of Campaign + relayer gas payer |
| Relayer EOA | TBD | — | — | Registered as `agent` on Campaign; pays `belanja()` gas; funded by operator |
| Demo recipient: Ani | TBD (custodial wallet addr) | — | — | WA number in relayer DB; `isPenerima = true` via `setPenerimaBatch` |
| Demo recipient: Budi | TBD | — | — | as above |
| Demo recipient: Citra | TBD | — | — | as above |
| Demo donor (path-A) | TBD | — | — | Bound Operator MetaMask? or separate donor key; pre-funded in T10.5 |
| Demo donor (path-B embedded) | TBD | — | — | WA-tied embedded wallet; pre-funded in T10.5 |

## RPC + utility

| Field | Value |
|---|---|
| Primary RPC | `https://sepolia.base.org` (Decision Q-3 — primary only, no fallback) |
| Chain ID | 8453 |
| Block explorer | https://sepolia.basescan.org |
| Faucet | see `docs/demo-prep.md` §0.3 |

## ABIs

Live in `contracts/out/` after each `forge build` (Foundry artifacts). The web module syncs them to `web/src/abi/` via the `pnpm sync-abis` prebuild hook (T6.2). Relayer imports the same ABIs via `contracts/bindings.ts` (T3.4).

## Deploy history (log)

| Date | What | Tx hash | Notes |
|---|---|---|---|
| TBD | MockIDRX deploy | TBD | |
| TBD | CampaignFactory deploy | TBD | |
| TBD | `createCampaign("Banjir Demak 2025", ...)` | TBD | |
| TBD | `setAgent(relayer_EOA)` | TBD | authorizes relayer as `agent || owner` per Decision 1 |
| TBD | `setWhitelist(toko_demo_1, true)` | TBD | demo store registration (deferred to demo-fixture prep) |
| TBD | `setWhitelist(toko_demo_2, true)` | TBD | |
| TBD | `setPenerimaBatch([Ani, Budi, Citra], [t,t,t])` | TBD | one MetaMask signature per Decision 1 (relayer OQ #1 Opsi A) |

> Cells marked TBD are filled by agent after operator pastes addresses back per `docs/demo-prep.md` §5.