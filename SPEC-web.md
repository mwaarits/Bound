# Spec: Bound — `web` module

> Phase 1 output (`spec-driven-development`). Approved map: `CAPABILITY_MAP.md`. Baseline: `prd.md` §4 (12-step flow), §6 (Next.js + wagmi/viem + qrcode.react, mobile-first); `SPEC-contracts.md` (events + setters); `SPEC-relayer.md` (REST endpoints).

## Assumptions I'm making (correct me now or I'll proceed)

1. **Next.js App Router + TypeScript + Tailwind**, mobile-first. App Router is current Next convention; Tailwind is the fastest path to a clean mobile UI.
2. **`wagmi v2` + `viem v2`** for own-wallet path (donor with MetaMask) and for public dashboard log reads (no indexer per PRD §11).
3. **Scanner lib: `html5-qrcode` (~50kb)** for the recipient phone camera, plus **manual-paste fallback** (PRD §6 lists both). Operator has approved the scanner + fallback pair.
4. **QR rendering: `qrcode.react`** on the store's "Create QR" page; relayer returns JSON payload, web renders the image.
5. **Only MetaMask connector** in wagmi config for the hackathon (donor own-wallet path). WalletConnect/multi-wallet is day-2.
6. **Deployed to Vercel** for demo day (free, zero-ops); the same Next app on any host works.
7. **ABI sync from `contracts/`** via a small `scripts/sync-abis.ts` build step (copy `contracts/out/*/abi.json` → `web/src/abi/`); CI or pre-build hook.
8. **No PWA/installable** in MVP — responsive mobile web is enough for the demo. Installable is day-2.

## Objective

A single Next.js mobile-first web app: four pages that cover every role flow in PRD §4. The web is what judges and recipients *see*; contracts are the truth, relayer is the silent teller, web is the stage.

Four primary pages (PRD §6 counts four):
1. **Donate** (`/campaign/[addr]/donate`) — donor picks own-wallet or embedded path, both end in `donasi()`. Path-A: connect MetaMask → faucet direct (tx signed in MetaMask) → approve → `donasi()`. Path-B: OTP login → embedded wallet auto-created + 0.001 Sepolia-ETH stipend credited → display address → "Faucet mIDRX" (POST `/donatur/faucet-embedded`; relayer signs `faucet()` with donor's embedded key) → "Donate" (POST `/donatur/donate-embedded`). Both paths hit the same contract `donasi()`.
2. **Recipient checkout** (`/penerima`) — WA OTP → "sisa hak belanja" → scan `/paste` → Pay → relayer submit.
3. **Store "Create QR"** (`/toko`) — cashier auth → amount → render QR.
4. **Operator dashboard** (`/campaign/[addr]`) — create campaign, whitelist→recipients batch flow, delist/limits, public pool/disbursed/whitelist/history (operator + read-only public view).

A thin `/` index lists campaigns (event reads from factory) —primary page, just an entry route.

Why it matters: in a 5-minute live demo, this page is the entire sensory experience for judges. Scan-to-confirm <30s (PRD §10), the DANA-feel checkout (no seed/gas), and the on-chain-readable dashboard all live or die here.

**Module boundary (consumes `contracts` + `relayer`):** reads ABIs/artifacts from `contracts/` via `sync-abis.ts`; calls REST endpoints from `SPEC-relayer.md`; reads chain events + state via viem directly (no indexer per PRD §11).

## Tech Stack

| Choice | Value | Reason |
|---|---|---|
| Framework | Next.js 14+ (App Router) | PRD §6; one web framework for all four pages |
| Language | TypeScript (strict) | Type safety on contract bindings + REST shapes |
| Wallet | `wagmi v2` + `viem v2` | PRD §6; v2 is current |
| Chain | Base Sepolia | Per intent; chain-id 8453 (testnet) |
| Connector | `@wagmi/connectors/metaMask` only | Donor own-wallet path; multi-wallet is day-2 |
| QR render | `qrcode.react` | PRD §6 |
| Scanner | `html5-qrcode` (~50kb) + manual-paste fallback | PRD §6; approved by operator |
| Styling | Tailwind CSS | Fastest path for mobile-first clean UI |
| Tests | Vitest (unit) + Playwright (e2e) | Vitest for components; Playwright for the §9 demo script |

Deliberate non-choices: no WalletConnect (day-2), no PWA/installable (day-2), no SSR/SEO optimization (it's an app, not a content site), no design-system dependency (Tailwind primitives suffice).

## Commands

```
Install:           pnpm install
Dev:               pnpm dev                # Next on :3000, hot reload
Build:             pnpm build              # runs sync-abis first (prebuild hook)
Sync ABIs:         pnpm sync-abis          # copies contracts/out/*/abi.json -> src/abi/
Test unit:         pnpm test               # vitest
Test e2e:          pnpm test:e2e           # playwright (needs local relayer + anvil fork)
Lint:              pnpm lint
Typecheck:         pnpm typecheck
```

## Project Structure

```
web/
  next.config.mjs
  tailwind.config.ts             canonical token source — see `docs/design-system.md` §6
  src/
    app/
      layout.tsx                    wagmi provider + relayer client provider + base shell
      page.tsx                      / — thin campaign index (viem logs from factory)
      campaign/[addr]/
        page.tsx                    dashboard + operator admin (create, whitelist, recipients batch, delist, limits, public pool/history)
        donate/page.tsx             donate page (path A own-wallet + path B embedded)
      penerima/page.tsx             recipient: OTP login -> sisa -> scan/paste -> Pay
      toko/page.tsx                 store: cashier auth -> amount -> render QR
    components/
      BoundWordmark.tsx             type-only "Bound" wordmark (lowercase, Plus Jakarta 800, no symbol)
      WalletConnect.tsx             wagmi MetaMask button
      CampaignCard.tsx              index list item
      DonateForm.tsx                own-wallet + embedded path switcher
      QrRender.tsx                  qrcode.react wrapper
      QrScanner.tsx                 html5-qrcode + manual-paste fallback
      Receipt.tsx                   scan result review (amount + store name + Pay)
      SisaHakBelanja.tsx            "sisa" display after OTP
      WhitelistTable.tsx            operator: store list + delist button
      RecipientBatchForm.tsx        operator: paste list -> prep setPenerimaBatch tx -> MetaMask sign
      PoolCard.tsx                  pool vs target
      HistoryFeed.tsx               event-sourced spend history
      ErrorToast.tsx                canonical Indonesian error renderer (BUKAN_PENERIMA etc)
    lib/
      wagmi-config.ts               chain = baseSepolia, connectors = [metaMask]
      viem-client.ts                public client for log reads
      relayer-client.ts             typed fetch wrapper for relayer REST (auth, qr, checkout, donate)
      abi/                          synced from contracts/ (gitignored except types)
      format.ts                     18-dec -> IDR display
    hooks/
      useCampaignLogs.ts            viem watchEvent for Donasi/Belanja/WhitelistDiubah/PenerimaDiubah
      useSisaHakBelanja.ts          read sudahBelanja + jatah for logged-in recipient
  scripts/
    sync-abis.ts                    prebuild: copy ABIs from ../contracts/out -> src/abi
  test/
    unit/                           vitest (component logic, format, error decode mappings)
    e2e/
      demo-script.spec.ts           Playwright: PRD §9 choreography (5-min demo)
      negative-paths.spec.ts        expired QR -> EXPIRED; outsider -> BUKAN_PENERIMA; delisted -> BUKAN_WHITELIST
```

## Code Style

TypeScript strict, App Router server components by default, `"use client"` only where wagmi/interactive. Naming follows `CONTEXT.md` (Indonesian for user-facing strings, English for code internals). No comments unless a rule is cited.

```tsx
// src/components/Receipt.tsx — scan result review before Pay (Penerima-facing: A11y-Warmth mood per design-system §2.1)
'use client';
import { useState } from 'react';

type QrPayload = { kampanye: string; toko: string; namaToko: string; jumlah: bigint; nonce: bigint; expiry: bigint };

export function Receipt({ payload, onPay }: { payload: QrPayload; onPay: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const expired = Date.now() > Number(payload.expiry);
  return (
    <div className="space-y-5 p-5">
      <div className="text-numeric-penerima text-primary">{formatIDR(payload.jumlah)}</div>
      <div className="text-body-lg text-secondary">di {payload.namaToko}</div>
      {expired
        ? <ErrorTag reason="EXPIRED" />
        : <button
            disabled={busy}
            onClick={async () => { setBusy(true); await onPay(); setBusy(false); }}
            className="w-full min-h-[48px] rounded-default bg-brand-primary text-display-md text-on-dark disabled:opacity-50"
          >Bayar</button>}
    </div>
  );
}
```

Conventions: every user-facing string in Indonesian (canonical terms from `CONTEXT.md`); error renderer maps contract custom-error hash → Indonesian label (`BUKAN_PENERIMA` → "Bukan penerima terdaftar", etc.); amounts always formatted via `formatIDR(bigint)`; mobile-first Tailwind (one column, large tap targets); no inline styles; server components for static dashboard reads, client only for interactive.

## Design System

Binding document: [`docs/design-system.md`](docs/design-system.md). Direction frozen: [`docs/ideas/web-visual-direction.md`](docs/ideas/web-visual-direction.md) (B+C Persona-split, approved 2026-11-21).

**Direction:** One palette (emerald + saffron + black + white) glues two mood rulesets switched per authenticated role, not per route.

- **Penerima-facing** (`/penerima/*`, `/toko/*`) — "A11y-Warmth": body ≥18px, tap ≥48×48px (WCAG 2.2 AAA), high-contrast only, no decorative tints, status double-encoded (color + icon + word), `<button>`/`<label>` semantic HTML only, no `<div onClick>`, no `text-body-sm` or `text-caption`, amounts use `text-numeric-penerima` (Plus Jakarta tabular, **not** mono).
- **Judge-facing** (`/`, `/campaign/[addr]/*`) — "Charity Ledger": black-dominant chrome on ≥768px, JetBrains Mono 16px amounts with `tnum`, emerald 1px ledger-line between rows, saffron fill + black text "settled" badge, spacious Stripe-density.
- **Cross-mood invariants:** same palette, typography scale, spacing 4-pt, radius, focus-visible ring (emerald-700 2px offset 2px, never removed). Density breakpoint `md` (768px): <768px forces compact warmth across all surfaces; ≥768px unlocks ledger-spacious on judge-facing surfaces.

**Tokens live in `web/tailwind.config.ts` `theme.extend`** (see design-system §6 for full map). No off-scale values; no `rounded-2xl` everywhere; no purple/indigo; no excessive gradients.

**Wordmark:** type-only "Bound" lowercase, Plus Jakarta ExtraBold 800, `-0.02em`. No symbol, no period, no emoji. Color flips (black on light, white on dark chrome).

**Saffron rule (hard):** `#F59E0B` is fill-only with black text/icon on top. White-on-saffron = 2.08:1 (fails WCAG AA both normal and large), prohibited. Use amber-700 `#B45309` if saffron-tone text is required.

**Emerald text rule (hard):** emerald-700 `#047857` for any text/links/icons on white. Emerald-600 `#059669` on white as text = 3.65:1 (fails AA normal), prohibited. Emerald-700 OK as primary action bg with white text (4.88:1 AA).

**Verification:** file-level checklist satisfied in design-system §7. Runtime checklist applies per-component at T6.x (axe-zero, focus-visible, 18px body verified at T10.2 Playwright + axe and T10.4 real Android phone).

## Testing Strategy

Vitest unit + Playwright e2e. Test plan:

| Concern | Test |
|---|---|
| Amount formatting | `500_000e18` → "Rp 500.000"; edge 0 |
| Error decode map | each canonical error hash → correct Indonesian label |
| QR render | `QrRender` produces a `<canvas>`/`<svg>` with the payload string |
| QR scan + paste fallback | camera path + manual paste both produce same `QrPayload` |
| Demo script §9 (Playwright e2e) | faucet → donate 10M → Ani scan 50K → store funded, pool −50K, history event; negative paths: expired, outsider, delisted |
| Scan-to-confirm timing | <30s end-to-end (PRD §10) |

e2e needs: local anvil fork with deployed contracts, relayer running locally, the four pages served. Coverage expectation: the §9 demo script runs green locally before any demo-day attempt; every negative path surfaces its canonical error visibly.

## Boundaries

- **Always:** `pnpm sync-abis` before build (no stale ABI shipping); mobile-first Tailwind (test on a real Android phone before demo day); canonical Indonesian error labels only (never synonym-ize); server components by default, `"use client"` only when needed; format all amounts via `formatIDR`.
- **Ask first:** adding a WalletConnect/multi-wallet connector; adding SSR/ISR for public pages; adding analytics; **adding a design-system package (shadcn/ui etc) — declined per `docs/design-system.md` §1, Tailwind tokens are binding**; changing chain away from Base Sepolia.
- **Never:** commit `.env` or relayer URLs with secrets; embed private keys anywhere (relayer handles custody); bypass `formatIDR` for raw token display; ship a page without the canonical error-to-Indonesian mapping; depend on an indexer (PRD §11 forbids — viem log reads only).

## Success Criteria

- [ ] PRD §9 5-minute demo script runs green locally on Playwright before demo day.
- [ ] Scan-to-confirm <30s end-to-end on a real Android phone via Base Sepolia (PRD §10).
- [ ] All four negative paths from §9 (no-send [by UI absence], expired → `EXPIRED`, outsider → `BUKAN_PENERIMA`, post-delist → `BUKAN_WHITELIST`) surface canonical Indonesian labels visibly.
- [ ] Operator dashboard: pool vs target, total disbursed, whitelist + delist buttons, full spend history — all read from chain events via viem, no indexer.
- [ ] Both donor paths (own-wallet + embedded OTP) reach `donasi()` and update the pool on-chain.
- [ ] Manual-paste QR fallback can complete a checkout when the camera fails (demo-day resilience).
- [ ] Mobile-first on a real Android phone: every page legible, every target tappable, every flow completable without a desktop.

## Decisions (frozen 2026-11-21, approved by operator)

1. **Routing: Next.js App Router** (`app/` directory, server components by default, `"use client"` only where wagmi/interactive). Current Next convention; nested layouts fit the operator dashboard.
2. **Styling: Tailwind CSS** — utility classes, mobile-first, built-in tap-target/responsive primitives. No design-system dependency; Tailwind primitives suffice.
3. **Wallet connector: MetaMask-only** (`@wagmi/connectors/metaMask`). WalletConnect multi-wallet is day-2 (avoid a second QR flow competing with the recipient checkout QR).
4. **Hosting: Vercel** — free hobby tier, one-command deploy, preview URLs for judges before demo day. Self-host is day-2 if vendor lock-in becomes a concern.
5. **Dashboard read path: direct viem `getLogs`** from the browser against Base Sepolia RPC. No relayer cache, no mini-indexer — strictly PRD §11 compliant; dashboard provably reads chain truth.
6. **Visual direction: B+C Persona-split** (frozen 2026-11-21, see `docs/ideas/web-visual-direction.md` + `docs/design-system.md`). One palette (emerald-700 + saffron-fill + black + white) glues two mood rulesets switched per authenticated role: Penerima-facing A11y-Warmth (body ≥18px, tap ≥48px, high-contrast only, status double-encoded, Plus Jakarta numeric) and judge-facing Charity Ledger (JetBrains Mono amounts, emerald ledger line, saffron "settled" badge, black chrome on ≥768px, spacious Stripe-density). Type-only "Bound" wordmark, Plus Jakarta ExtraBold 800 lowercase. Design-system package dependency (shadcn/ui etc) declined — Tailwind tokens binding. Dark mode declined — Penerima familiarity is light-mode DANA. Pre-build user testing skipped — assumptions validated at T10.4 real Android device + judge proxy at demo.