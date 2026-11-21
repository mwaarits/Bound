# Bound — Deployments

> Contracts deployed on **Ethereum Sepolia** (chain ID 11155111).
> MetaMask was on Ethereum Sepolia during Remix deploy; configs updated to match.
> Runbook: `docs/demo-prep.md`. Spec: `SPEC-contracts.md`.

## Ethereum Sepolia (chainId 11155111)

| Label | Address | Verified | Notes |
|---|---|---|---|
| MockIDRX | 0xb21ef113569c97634020E7D68cB435E8826Fa8fA | ✅ name="Mock IDRX", decimals=18 | ERC20 faucet, 1 token = IDR 1 |
| CampaignFactory | 0xBEEEfb11B32451756F716cea1009711DA8Ea6512 | ✅ has bytecode | createCampaign → Campaign; event-only discovery |
| Campaign (Banjir Demak 2025) | 0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef | ✅ owner=Operator, jatah=500K, token=MockIDRX | jatah 500K, maxPerTx 200K, maxPerHari 500K |
| Operator EOA | 0xeD0d1Ac68e75246EbFD8E54bC4A4C898C3B3faE1 | ✅ owner of Campaign | Bound Operator MetaMask account |
| Relayer EOA | 0x8ba8dA7065dd0D5d9150f83888A50eE999199E26 | ⚠️ NOT YET SET AS AGENT | Must call setAgent on Campaign; agent currently 0x0 |

## RPC + utility

| Field | Value |
|---|---|
| Chain | Ethereum Sepolia (NOT Base Sepolia) |
| Chain ID | 11155111 |
| Primary RPC | `https://ethereum-sepolia-rpc.publicnode.com` (Decision Q-3 — primary only, no fallback) |
| Block explorer | https://sepolia.etherscan.io |
| Faucet | see `docs/demo-prep.md` §0.3 (Ethereum Sepolia faucets, not Base) |

## ⚠️ Action required: setAgent

The Campaign's `agent` is still `0x0000000000000000000000000000000000000000`. The relayer CANNOT submit `belanja()` calls until the operator calls `setAgent(relayer_EOA)` on the Campaign contract.

To fix via Remix:
1. Contract dropdown → select **Campaign**
2. "Add Contract" / "At Address" → paste `0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef`
3. Find `setAgent` → paste `0x8ba8dA7065dd0D5d9150f83888A50eE999199E26`
4. Click transact → MetaMask confirm (Ethereum Sepolia, Bound Operator account)

Or via Etherscan:
1. Open https://sepolia.etherscan.io/address/0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef#writeContract
2. Connect to Web3 → Bound Operator account
3. Find `setAgent` → paste relayer address → Write

## ⚠️ Action required: relayer private key

`relayer/.env` currently has a placeholder/anvil private key that does NOT match the relayer EOA (0x8ba8dA7065dd0D5d9150f83888A50eE999199E26). Replace `RELAYER_PRIVATE_KEY` in `relayer/.env` with the actual private key for this address (from `cast wallet new` or MetaMask export).

## ABIs

Live in `contracts/out/` after each `forge build` (Foundry artifacts). The web module syncs them to `web/src/abi/` via the `pnpm sync-abis` prebuild hook (T6.2). Relayer imports the same ABIs via `contracts/bindings.ts` (T3.4).

## Deploy history

| Date | What | Tx hash | Notes |
|---|---|---|---|
| 2026-11-21 | MockIDRX deploy | TBD | Ethereum Sepolia (not Base Sepolia) |
| 2026-11-21 | CampaignFactory deploy | TBD | |
| 2026-11-21 | createCampaign("Banjir Demak 2025", 500K, 200K, 500K) | TBD | |
| TBD | setAgent(relayer_EOA) | TBD | ⚠️ NOT YET DONE — required before demo |
