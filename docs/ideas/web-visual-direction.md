# Bound — Web Visual Direction

## Problem Statement

How might we design Bound's web visual identity (color/font/component tokens) so that Penerima (low crypto-literacy Android users familiar with DANA/e-wallet) feels the aid is safe from judol, and Donatur/Operator/hackathon judges (crypto-aware) see a serious, decentralized, production-grade platform — all within Tailwind-only + light green/white/black + type-only "Bound", treating both audiences as equal design pivots?

## Recommended Direction

**Persona-split dual-mood, one palette.** The same emerald + saffron + black + white palette glues two distinct visual rulesets, switched per authenticated persona — not per route. Penerima-facing surfaces (login → sisa → scan → receipt → pay) follow an a11y-first DANA-warmth rule: high-contrast only, body 18px+, tap targets ≥48px, status double-encoded (color + icon + word, never color alone), compact DANA-density with breathing room in the receipt-review step. Judge-facing surfaces (donate page, operator admin, public dashboard) follow a Charity-Ledger rule: black-dominant chrome, monospace pixel-perfect amounts, emerald as ledger line, saffron for "settled" badge, spacious Stripe-density — so the on-chain audit metaphor becomes visible, not just claimed.

The type-only "Bound" wordmark binds both moods: Plus Jakarta Sans (display weight for "Bound", regular for body) is the signature across surfaces. Monospace (JetBrains Mono / IBM Plex Mono / Geist Mono — decided in design-system phase) is *functional* only, restricted to numeric amount cells in ledger mood, never used for body or brand display. Skipping pre-build user testing: the familiarity/ledger/cold-vs-transparent assumptions are validated on a real Android device at T10.4, not in mockup review.

This direction resolves the tension between "Penerima needs DANA-familiarity for instant trust" (Direction A thesis) and "ledger transparency wins judges" (Direction B thesis) by refusing the trade-off — each persona gets the rule that fits its stake. The cost is brand schizophrenia risk: the two moods must share palette + typography + wordmark rigorously, or "Bound" dissolves into two apps.

## Key Assumptions to Validate

- [ ] BSH Penerima real-world skew older/low-vision → tested on real Android device at T10.4 with at least one recipient demographic match
- [ ] Ledger aesthetic reads "transparent" not "bureaucratic cold" to non-crypto Donatur → tested via judge-proxy at demo (no separate pre-mockup test per user choice)
- [ ] Plus Jakarta Sans heavy display weights load acceptably on Android murah → network-throttle check during T6.x scaffold
- [ ] ≥48px tap target + 18px+ body fits compact DANA-ish density without vertical overflow on 5" Android → T10.4 device test
- [ ] Saffron reads "settled/success" not "warning" when adjacent to red-error states → resolved in Phase B by using red #DC2626 exclusively for errors and saffron exclusively for positive settlement confirmation

## MVP Scope

**In:**
- One `web/tailwind.config.ts` tokens file: color (emerald primary, saffron success-only, black, white, plus semantic surfaces), typography scale (display/body/numeric/mono), spacing 4-pt grid, radius, shadow, focus-ring
- Two rule sets documented: Penerima-facing a11y-warmth, judge-facing ledger
- Component inventory per SPEC-web Project Structure with state matrix (idle/hover/focus/disabled/loading/error/success) and a11y specifics
- WCAG AA evidence table per token pair (computed contrast ratios, tap-target sizes)
- Type-only "Bound" wordmark spec (font weight, kerning, sizing across breakpoints)
- `docs/design-system.md` artifact

**Out:**
- Dark mode (light-only for MVP — Penerima familiarity is light-mode DANA)
- Logo symbol beyond wordmark
- Illustrations / hero imagery / cultural pattern
- Animation library beyond Tailwind defaults
- shadcn/ui or any design-system package dependency

## Not Doing (and Why)

- **Dark mode** — Penerima familiarity is light-mode DANA/e-wallet; dark add risk for low-literacy
- **Logo symbol** — type-only per user anchor; signature via typography, not icon
- **Batik / cultural pattern (#3 Batik Currents)** — risks diluting anti-judol clinical-trust signal
- **shadcn/ui or design-system dependency** — SPEC-web Boundary "Ask first" declined; Tailwind primitives suffice
- **Withdrawal-flow negative-space cues (#8)** — read "broken" to Penerima, violates clinical-trust
- **Three-component radical minimal (#4)** — would force SPEC-web Project Structure surgery prematurely
- **Familiarity-only Direction A** — too generic, low differentiation for hackathon
- **Pure Direction C as uniform mood** — sacrifices judge wow on donate/dashboard

## Open Questions

> **All 6 below resolved by `docs/design-system.md` (2026-11-21). Kept here for traceability of the decision trail.**

- Monospace pick: **JetBrains Mono** (weights 400, 500; subsets `latin`) — functional only, ledger mood, never on Penerima surfaces.
- Emerald hue final: **emerald-700 `#047857`** for any text/links/icons on white (4.88:1 AA); emerald-600 `#059669` prohibited as text (3.65:1 fails AA normal).
- Plus Jakarta weights: full family loaded (400, 500, 600, 700, 800) via `next/font/google`, `subsets: ['latin']`, `display:'swap'`; italic variants not loaded (perf budget).
- Density breakpoint: confirmed `md` (768px) — <768px strict Penerima-warmth across all surfaces; ≥768px judge-facing unlocks ledger-spacious.
- Wordmark treatment: "Bound" (lowercase), **no period** — type-only, Plus Jakarta 800, `-0.02em`, no symbol/emoji/dot.
- Penerima transit never sees ledger mood — auth flows separated by role-gated routes (`/penerima/*`, `/toko/*`).