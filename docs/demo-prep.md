# Bound — Contract Deploy Runbook (T2.1 → T2.3)

> Remix-only deploy per PRD §6 ("Solidity deployed via Remix to Base Sepolia testnet").
> Operator (you) drives Remix + MetaMask; agent verifies via `cast` after each step.
> All URLs verified against Base docs (https://docs.base.org) at authoring time; re-confirm on demo day.

---

## 0. Prereqs (before opening Remix)

### 0.1 MetaMask: add Base Sepolia network

In MetaMask → Networks → Add network → Add a network manually:

| Field | Value |
|---|---|
| Network name | Base Sepolia |
| RPC URL | `https://sepolia.base.org` |
| Chain ID | `8453` |
| Currency symbol | `ETH` |
| Block explorer | `https://sepolia.basescan.org` |

### 0.2 MetaMask: pick the deployer EOA

This will be:
- **Operator** for the demo Campaign (BR-02: only operator registers whitelist/recipients)
- **Source of the initial `MockIDRX` supply** (constructor mints 1,000,000 mIDRX to deployer)
- Payer of deploy gas + the demo-donasi gas (donor own-wallet path A)

Generate or pick one MetaMask account. Label it **"Bound Operator"** in MetaMask. Copy its `0x...` address — you'll need it in §2.3.

### 0.3 Fund deployer with Base Sepolia ETH

Deployer needs ≥0.05 Sepolia-ETH for: 3 contract deploys + 1 factory.createCampaign + gas tank top-up for relayer (T2.2/T10.5).

Free faucet options (ranked by ease, all require login of some kind):

| Faucet | URL | Notes |
|---|---|---|
| Coinbase | `https://www.coinbase.com/faucets/base-sepolia-faucet` | Base-specific; ~0.05 ETH/drip; Coinbase account required; cap per wallet |
| Thirdweb | `https://thirdweb.com/base-sepolia-testnet` | Multi-chain; GitHub/email login; smaller drip |
| Alchemy | `https://www.alchemy.com/faucets/base-sepolia` | Free signup; API key; mid-size drip |
| QuickNode | `https://faucet.quicknode.com/base/sepolia` | Free; main social login |

Pick one, drip 0.05+ ETH to the Bound Operator address. Verify on https://sepolia.basescan.org by pasting the address in the search bar — balance should show ≥0.05 ETH.

If a faucet rate-limits, try the next; if all fail, ask in the Base Discord faucet channel.

### 0.4 Local tooling check (agent side, you don't act here)

The agent confirms Foundry artifacts exist (`contracts/out/`) and flattened paste-ready sources exist (`contracts/flattened/{MockIDRX,Campaign,CampaignFactory}.sol`). Both already verified in this prep step — proceed.

---

## 1. Deploy MockIDRX (T2.1 first)

Target: ERC20 faucet token, no constructor args.

### 1.1 Open Remix + load flattened source

1. Open https://remix.ethereum.org in a desktop browser.
2. In File Explorer (left panel), right-click `contracts` → New File → name it `MockIDRX.sol`.
3. Open `contracts/flattened/MockIDRX.sol` from this repo in any editor, copy all 615 lines.
4. Paste into the Remix `MockIDRX.sol` file — replace the default content entirely.

### 1.2 Compile in Remix

1. Click the **Solidity Compiler** icon (looks like a "S" logo, left panel).
2. Settings:
   - Compiler: **0.8.24**
   - Auto-compile: ON (optional)
   - Enable optimization: ✅ checked, runs: **200**
   - EVM version: default (cancun or paris OK; cancun matches foundry.toml)
3. Click **Compile MockIDRX.sol**.
4. Green checkmark ✅ appears next to the file in File Explorer = compile success.
   - If red ❌: read the error; most likely line-end issue from pasting — re-paste preserving newlines.

### 1.3 Deploy MockIDRX

1. Click the **Deploy & Run Transactions** icon (looks like a rocket logo, left panel).
2. Settings:
   - Environment: **Injected Provider - MetaMask** → MetaMask popup → connect to your "Bound Operator" account on **Base Sepolia**.
   - Account: Bound Operator (`0x...`).
   - Contract: **MockIDRX**.
   - Deploy button next to it should show **no constructor arguments** (MockIDRX constructor takes none).
3. Click **Deploy**. MetaMask popup → Confirm.
4. Wait for tx confirm (~5-15s). Status "success" in the Remix console at the bottom.
5. **Copy the deployed MockIDRX address** from the "Deployed Contracts" section under the file. Format: `0xABC...`. Save it locally — you'll paste it to the agent next.

### 1.4 Agent verifies MockIDRX (paste the address back to agent)

Agent will run:
```
cast call <MockIDRX_addr> 'name()(string)'           → "Mock IDRX"
cast call <MockIDRX_addr> 'symbol()(string)'         → "mIDRX"
cast call <MockIDRX_addr> 'decimals()(uint8)'        → 18
cast call <MockIDRX_addr> 'faucet()()'               # dry-run; revert=ok since payable-ish mints
cast call <MockIDRX_addr> 'balanceOf(address)(uint256)' <operator_addr>  → 1_000_000e18
```
If these return expected values, MockIDRX is verified live.

---

## 2. Deploy CampaignFactory (T2.1 second)

Target: factory, no constructor args.

### 2.1 Load + compile flattened source

1. In Remix File Explorer → New File → `CampaignFactory.sol` under `contracts`.
2. Copy contents of `contracts/flattened/CampaignFactory.sol` (672 lines) → paste.
3. Solidity Compiler → Contract dropdown → **CampaignFactory** → Click Compile CampaignFactory.sol.
4. Green check ✅.

### 2.2 Deploy CampaignFactory

1. Deploy & Run → Contract dropdown → **CampaignFactory**.
2. No constructor args.
3. Click **Deploy** → MetaMask confirm.
4. Copy the deployed **CampaignFactory address** `0x...`.

### 2.3 Agent verifies CampaignFactory

Agent will run:
```
cast call <Factory_addr> 'isContract()'    # may not exist; alternative minimal smoke:
cast code <Factory_addr>                   → non-empty bytecode string (deploy-confirmed)
# Optionally call createCampaign with an extreme-low amount to confirm factory → Campaign deploy path works
# (deferred to §3 since real demo campaign is the meaningful deploy)
```

---

## 3. Create the demo Campaign via Factory (T2.2)

Target: deploy Campaign "Banjir Demak: 100 × @500K" via factory's `createCampaign`. Same constructor-arg values the unit tests used.

### 3.1 Constructor args for `createCampaign`

| Arg | Position | Value | Hex / decimal |
|---|---|---|---|
| `token` | 1 | MockIDRX address from §1.3 | `0xABC...` |
| `name` | 2 | "Banjir Demak 2025" | string |
| `jatahPerPenerima` | 3 | 500,000 IDR | `500000000000000000000000` (= `500_000e18`) |
| `maxPerTx` | 4 | 200,000 IDR | `200000000000000000000000` (= `200_000e18`) |
| `maxPerHari` | 5 | 500,000 IDR | `500000000000000000000000` (= `500_000e18`) |

Decimal strings: multiply IDR × 10^18 (18 decimals on MockIDRX, "1 token = IDR 1").

### 3.2 Call createCampaign from Remix

1. Deploy & Run → keep **Injected Provider - MetaMask** + Bound Operator account selected.
2. In "At Address" field (lower-left, "Load contract from Address"): paste the **CampaignFactory address** from §2.2.
3. From contract dropdown — you now have **CampaignFactory** loaded as an *instance* (under "Deployed Contracts" → expand it).
4. Find the **`createCampaign`** function; it will show input fields:
   - `token (address)`: paste MockIDRX address
   - `name (string)`: type `Banjir Demak 2025`
   - `jatahPerPenerima (uint256)`: paste `500000000000000000000000`
   - `maxPerTx (uint256)`: paste `200000000000000000000000`
   - `maxPerHari (uint256)`: paste `500000000000000000000000`
5. Click **transact**. MetaMask confirm.
6. Wait for confirm. Remix console prints a transaction hash + the **Campaign address** (return value of `createCampaign`).
7. **Copy the deployed Campaign address** `0x...`.

You'll also see a `CampaignCreated` event in the Remix "Logs" panel — the verification trail is live from here on.

### 3.3 Agent verifies Campaign

Agent will run:
```
cast call <Campaign_addr> 'token()(address)'           → MockIDRX address
cast call <Campaign_addr> 'owner()(address)'           → Bound Operator address
cast call <Campaign_addr> 'jatahPerPenerima()(uint256)' → 500_000e18
cast call <Campaign_addr> 'maxPerTx()(uint256)'        → 200_000e18
cast call <Campaign_addr> 'maxPerHari()(uint256)'      → 500_000e18
# Confirm CampaignCreated event fired: query factory logs
cast logs <Factory_addr> 'CampaignCreated(address,address,address,string,uint256,uint256,uint256)' --from-block latest
```

### 3.4 Set the relayer EOA as agent (pre-demo)

The **relayer EOA** ($RELAYER_PRIVATE_KEY in your relayer .env) is what pays gas for `belanja()` calls. To authorize it on-chain as the agent:

1. In Remix, go to the Campaign instance; find **`setAgent`** function.
2. Input: paste the relayer EOA address (the one you'll use in the relayer `.env`).
3. Click **transact**. MetaMask confirm (Bound Operator account).
4. Verify:
```
cast call <Campaign_addr> 'agent()(address)' → matches relayer EOA
```

Save the **relayer EOA address** — you'll need it in `relayer/.env` AND for the gas-tank top-up in T10.5.

---

## 4. Verify source on BaseScan (T2.2 part 2)

For each of the 3 contracts (MockIDRX, CampaignFactory, Campaign), verify source so judges can read it.

### 4.1 Per-contract verify (BaseScan web UI)

For each contract address:

1. Open https://sepolia.basescan.org/address/<contract_address>
2. Tab: **Contract** → click **"Verify and Publish"**.
3. Settings:
   - Compiler type: **Solidity (Single file)**
   - Compiler version: **0.8.24**
   - Open Source License: **MIT**
4. Next page:
   - Optimization: **Yes**, runs: **200**
   - EVM version: default (or cancun if asked)
5. Paste the **flattened source** of that contract from `contracts/flattened/` directory (same as you pasted into Remix).
6. Submit. If green ✅ — verified. Contract Code tab now shows readable source.

If verification fails on byte-size mismatch, retry with EVM version = "paris" (cancun may add PUSH0 opcodes that differ from default compiler target). If still failing, use **"Standard JSON Input"** path: extract `out/<Contract>.sol/<Contract>.json` from `contracts/out/` and upload + the standard input JSON — last resort.

### 4.2 Agent confirms verification

Agent will fetch each BaseScan URL and check for the green ✅ verification badge, or run:
```
cast verify-code <Contract_addr> --chain-id 8453 --compiler-version v0.8.24+commit.e11b6c23
```
(If cast verify-code isn't easily wireable, agent opens the BaseScan page via webfetch.)

---

## 5. Record addresses + ABIs (T2.3)

After §1-4 are all green, **paste back to the agent** this block:

```
MockIDRX:           0x...
CampaignFactory:    0x...
Campaign (Banjir Demak 2025): 0x...
Operator EOA:       0x...   (= Bound Operator MetaMask account)
Relayer EOA:        0x...   (separate EOA for relayer gas tank + belanja submit)
```

The agent will:
- Write these into `docs/deployments.md`
- Copy ABIs from `contracts/out/{MockIDRX,Campaign,CampaignFactory}.sol/*.json` → `web/src/abi/` placeholder for T6.2
- Note demo fixture recipients (Ani/Budi/Citra WA numbers + relayer-generated wallet addresses, generated later in T3.3 / T9.3)

Once `docs/deployments.md` is populated, **T2.1 / T2.2 / T2.3 are all marked done** with verification evidence (cast call succeeds + BaseScan verified ✅).

---

## 6. Risk / fallback notes

- **Remix compile fails with version mismatch**: ensure Solidity Compiler plugin version dropdown is set to 0.8.24, not 0.8.20 or higher. Remix auto-downloads; sometimes lags a release.
- **MetaMask pops up on wrong network**: switch MetaMask to Base Sepolia manually before each Remix deploy; "Injected Provider" inherits whatever MetaMask is on.
- **`createCampaign` tx reverts with "creation code too large" or similar**: re-flatten via agent (rerun `forge flatten`) — sometimes OZ version differences in flatten create a contractual ordering bug.
- **BaseScan verification automation limits**: Basescan occasionally throttles verify-contract endpoints; if it errors "max 5 per minute" → wait 60s + retry; or try Standard JSON Input.
- **Faucet says "you already dripped recently"** → use a 2nd faucet from §0.3 list.
- **Demo-day network hang while showing judges**: pre-deploy cannot be skipped; on demo day itself, never deploy live — only use these pre-deployed addresses; §T10.1 covers that.

## 7. Stop and report back

When all three contracts are: deployed + pasted back + cast-verified by agent + BaseScan source-verified, the **Foundation phase (Phase 1: contracts) is fully complete**, and Phase 2 (relayer + web) can begin.