# Spec: Bound — `contracts` module

> Phase 1 output (`spec-driven-development`). Approved map: `CAPABILITY_MAP.md`. Baseline: `prd.md` (BR-01…BR-12), `CONTEXT.md` language.

## Objective

The on-chain core of Bound: three Solidity contracts on Base Sepolia testnet that make donations spendable only at whitelisted stores.

- **MockIDRX** — standard ERC20 stand-in for IDRX (1 token = IDR 1) with a public faucet; exists only for testnet convenience.
- **CampaignFactory** — deploys Campaign instances with operator-provided parameters; emits discovery events.
- **Campaign** — a per-campaign programmable-money vault: pool for donations, whitelist store registry, recipient registry, per-recipient quota with per-tx and daily limits, dynamic-QR checkout gated by expiry + single-use nonce. The **only** fund-moving paths are `donasi()` in and `belanja()` out (BR-08, by construction).

Why it matters: these three contracts are what judges can read on-chain — they carry the anti-judol guarantee (no free-transfer path) and the full audit trail (events for 100% of spends and whitelist edits, PRD §10).

**Module boundary (consumed by `relayer` and `web`):** deployed addresses on Base Sepolia + verified ABIs. Downstream modules read state via viem/ethers from events (`Donasi`, `Belanja`, whitelist/recipient changes) and write via `donasi` (donor tx, user-gas) and `belanja` (submitted by the approved relayer `agent`, operator-funded gas).

## Tech Stack

| Choice | Value | Reason |
|---|---|---|
| Language | Solidity `^0.8.24` | Standard; supported on Base (EVM) |
| Framework | Foundry (`forge`, `forge-std`) | Fast tests, gas reports; deploy day uses Remix per PRD §6 |
| Dependencies | OpenZeppelin `@openzeppelin/contracts` (ERC20, Ownable2Step, ReentrancyGuard) | Battle-tested base only; ask first before adding anything else |
| Target network | Base Sepolia testnet | Per intent; revisitable on merit, not sponsor mandate |

Chosen deliberately, flagged for review:
- Custom errors (not require-strings) named with the canonical PRD failure strings, decoded to Indonesian text in downstream UI. Cheaper gas; names match `CONTEXT.md` exactly.
- Campaign is plain `new` deployment from factory (no proxy/minimal-proxy) — one campaign per operator drive, transparency over gas savings.
- Amounts: 18-decimal raw token units; 500,000 IDR ≡ `500_000e18`. UI does formatting.
- Day boundary for BR-05: UTC (`block.timestamp / 1 days`), Indonesia-timezone alignment explicitly out of MVP scope.

## Commands

```
Build:      forge build
Test:       forge test -vvv
Coverage:   forge coverage
Fork test:  forge test --fork-url $BASE_SEPOLIA_RPC
Deploy:     Remix (PRD §6) — record deployed addresses in docs/deployments.md
Install:    forge install foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts
```

## Project Structure

```
contracts/
  foundry.toml
  lib/                    forge-std, openzeppelin
  src/
    MockIDRX.sol          faucet ERC20 (~10 lines, PRD §11 note)
    CampaignFactory.sol
    Campaign.sol
  test/
    MockIDRX.t.sol
    CampaignFactory.t.sol
    Campaign.t.sol        one test per BR + invariants
  script/
    DeployLocal.s.sol     local/anvil bootstrapping only (demo-day deploy stays Remix)
```

Top-level repo layout across modules: `contracts/`, `relayer/`, `web/` (sibling dirs, monorepo).

## Code Style

Naming is canonical from `CONTEXT.md`/PRD — Indonesian function and state names for domain concepts, English for generic infrastructure. No comments unless a rule needs citation; the rules live in this spec, not the code.

```solidity
contract Campaign is Ownable2Step, ReentrancyGuard {
    IERC20 public immutable token;
    address public agent;              // relayer EOA, set by operator
    uint256 public jatahPerPenerima;   // quota per recipient
    uint256 public maxPerTx;
    uint256 public maxPerHari;
    mapping(address => bool) public isWhitelist;
    mapping(address => bool) public isPenerima;
    mapping(address => uint256) public sudahBelanja;
    mapping(address => mapping(uint256 => uint256)) public belanjaHariIni;
    mapping(uint256 => bool) public nonceTerpakai;

    error BUKAN_PENERIMA();
    error BUKAN_WHITELIST();
    error JATAH_HABIS();
    error POOL_HABIS();
    error LIMIT();
    error EXPIRED();
    error NONCE_DIGUNAKAN();

    function donasi(uint256 jumlah) external nonReentrant { /* transferFrom + event Donasi */ }

    function belanja(address penerima, address toko, uint256 jumlah, uint256 nonce, uint256 expiry)
        external nonReentrant { /* agent||owner gated; BR-01..07 checks; transfer to toko; events */ }

    function setWhitelist(address toko, bool diizinkan) external onlyOwner { /* emit WhitelistDiubah */ }
    function setPenerimaBatch(address[] calldata orang, bool[] calldata diizinkan) external onlyOwner {
        /* require orang.length == diizinkan.length; per-element isPenerima := diizinkan; emit PenerimaDiubah */
    }

    event Donasi(address indexed donatur, uint256 jumlah);
    event Belanja(address indexed penerima, address indexed toko, uint256 jumlah, uint256 nonce);
    event WhitelistDiubah(address indexed toko, bool diizinkan);
    event PenerimaDiubah(address indexed penerima, bool diizinkan);
}
```

Conventions: immutable over storage where possible; events indexed for dashboard queries; every state change emits an event (PRD §10); zero external calls beyond the token contract; noIran admin key rotation risk accepted via Ownable2Step transfer only.

## Testing Strategy

Framework: Foundry unit + invariant tests in `test/`. Coverage expectation: **every BR rule maps to at least one named test** (BR-01…BR-09), so the BR table doubles as the test plan:

| BR | Test |
|---|---|
| BR-01 | outsider cannot `belanja` → `BUKAN_PENERIMA`; valid recipient passes |
| BR-02 | non-whitelisted store → `BUKAN_WHITELIST`; unlisted-then-listed flows pass |
| BR-03 | spend beyond quota → `JATAH_HABIS`; beyond remaining pool → `POOL_HABIS` |
| BR-04 | `jumlah > maxPerTx` → `LIMIT` |
| BR-05 | daily total across txs `> maxPerHari` → `LIMIT` |
| BR-06 | past `expiry` → `EXPIRED` |
| BR-07 | nonce reuse → `NONCE_DIGUNAKAN` |
| BR-08 | invariant: contract token balance decreases **only** via `Belanja` events to whitelisted stores; no admin withdraw anywhere |
| BR-09 | delist → in-flight valid-expiry QR checkout reverts `BUKAN_WHITELIST` |

Invariants (forge `invariant/`): pool solvency (`token.balanceOf(campaign) == totalDonasi − totalBelanja`), `sudahBelanja ≤ jatahPerPenerima` per recipient, nonce never repeats.

Demo-day acceptance: contracts deployed via Remix to Base Sepolia, source-verified (BaseScan), addresses + ABIs recorded in `docs/deployments.md` for `relayer`/`web`.

## Boundaries

- **Always:** forge build + test green before any spec-status update; canonical error/event names only (never synonym-ize; `CONTEXT.md` rules); emit an event for every whitelist/recipient edit and every spend; keep `token` immutable at Campaign creation.
- **Ask first:** adding dependencies; adding operator refund/cancellation path (BR-08 adjacent); changing day boundary from UTC; changing QR expiry semantics; any multisig/multitoken abstraction.
- **Never:** add a transfer/withdraw path out of the Campaign pool other than `belanja()` to a whitelisted store (this is the product guarantee); use require-strings with non-canonical wording; hardcode relayer address into Campaign bytecode (set `agent` in constructor args, changeable by operator).

## Success Criteria

- [ ] All BR-01…BR-09 tests green; invariant suite green; `forge coverage` touched every rule branch.
- [ ] Demos PRD §9 choreography from a fresh local chain: faucet → donate 10M → Ani scans 50K QR → store +50K, Ani spent 50K, pool −50K, history event; negative paths revert with canonical errors (expired QR, outsider, delisted store).
- [ ] Deployed + verified on Base Sepolia via Remix; addresses documented.
- [ ] Interface ready for downstream: ABIs + events stable enough for `relayer` to build against.

## Decisions (frozen 2026-11-10, approved by operator)

1. **`belanja()` submitter: restricted to `agent || owner`** — relayer EOA registered by the operator (matches PRD §4 step 9: backend verifies then submits). Permissionless submission noted verbally as a future evolution, not built.
2. **Faucet: `faucet()` mints 10,000,000 IDR-equivalent (`10_000_000e18`) per call, unlimited calls** — the demo donor path is faucet → approve → `donasi()` in three taps for a 10M donation. Pattern: mints to `msg.sender` (standard); no `faucetTo(address)` variant needed. Works for both donor paths — path-A (own-wallet) donor calls faucet directly so `msg.sender` = donor's MetaMask; path-B (embedded) relayer submits `faucet()` signing with the donor's embedded key so `msg.sender` = donor's embedded wallet. Same faucet function in both flows.
3. **Token naming: "Mock IDRX", symbol `mIDRX`**, 18 decimals, 1 token = IDR 1. Honest stand-in, not pretending to be real IDRX.
4. **Factory discovery: event-only** — `CampaignCreated` emitted, no on-chain registry storage; `web` reads logs directly (PRD: no indexer in MVP).
5. **Operator cancel/refund: omitted** — BR-08 stays strict (only `donasi()` in, `belanja()` out). Campaign close-out refund is a stated day-2 governance topic if judges ask; contract stays clean of a third fund path.
