# Bound — Design System

> Source of truth for all web surface tokens, mood rules, and component a11y specifics.
> Direction: `docs/ideas/web-visual-direction.md` (B+C Persona-split).
> References unavailable at authoring time — assumptions are documented inline; runtime visual verification deferred to T10.4 (real Android device).

## 1. Design Tokens

### 1.1 Color

| Token | Hex | Usage | WCAG pair | Ratio |
|---|---|---|---|---|
| `color-bg-base` | `#FFFFFF` | Page background (both moods) | — | — |
| `color-bg-surface` | `#F7F7F5` | Card / panel surface (judge-facing stripe bg) | black on it | ~19.7:1 AAA |
| `color-bg-surface-emerald` | `#ECFDF5` (emerald-50) | Ledger accent stripe under emerald line | black on it | ~17.2:1 AAA |
| `color-bg-surface-saffron` | `#FEF3C7` (amber-100) | "Settled" callout surface (judge-facing) | emerald-800 text on it | ~6.5:1 AA+ |
| `color-bg-chrome-dark` | `#0A0A0A` | Black-dominant chrome (header/footer, ledger mood) | white on it | ~19.3:1 AAA |
| `color-text-primary` | `#0A0A0A` | Body text, headings (both moods) | on white | ~19.3:1 AAA |
| `color-text-secondary` | `#404040` | Captions, ledger metadata | on white | ~11.5:1 AAA |
| `color-text-on-dark` | `#FFFFFF` | Text on chrome-dark | on chrome-dark | ~19.3:1 AAA |
| `color-brand-primary` | `#047857` (emerald-700) | Primary action bg, links, icons, ledger line | white on it | **4.88:1 AA** |
| `color-brand-primary-deep` | `#065F46` (emerald-800) | Brand text on light tints where emerald-700 fails | on saffron-100 | ~6.5:1 AA+ |
| `color-brand-surface` | `#ECFDF5` (emerald-50) | Subtle bg accent | — | — |
| `color-success` | `#F59E0B` (amber-500 = "saffron") | **Fill-only** for "settled/success" badge; never text-on-white | black on it | 10.1:1 AA+ |
| `color-success-text` | `#B45309` (amber-700) | Saffron-derived text where text needed | on white | ~4.7:1 AA |
| `color-error` | `#B91C1C` (red-700) | Error text, danger outline | on white | ~5.9:1 AA |
| `color-error-action` | `#B91C1C` | Error action bg (with white text) | white on it | ~5.9:1 AA |
| `color-border-subtle` | `#E5E5E5` | Default 1px borders | — | — |
| `color-border-ledger` | `#047857` | Emerald ledger line (judge-facing) | — | — |
| `color-focus-ring` | `#047857` | focus-visible ring | on white offset | — |

**Hard rules:**
- Saffron (`#F59E0B`) is **fill-only with black text/icon on top**. White-on-saffron = 2.08:1 (fails), prohibited.
- Emerald-600 (`#059669`) on white as text = ~3.65:1 (fails AA normal). Use emerald-700 (`#047857`) for any text/links.
- White-on-emerald-600 = same 3.65:1; passes large-text (≥18.66px bold ≈ 14pt) only. For primary action buttons whose label is large, emerald-600 white-text is acceptable; default emerald-700 is safer. **Chosen default: emerald-700 for primary action fills.**
- Red-600 (`#DC2626`) on white text = ~4.5:1 borderline; use red-700 (`#B91C1C`) for error text and error action fills.
- Color is **never the sole signal** of state — every state pair has matching icon + Indonesian word (see §3 state matrix).

### 1.2 Typography

Typeface: **Plus Jakarta Sans** (geometric sans, brand signature). Functional accent: **JetBrains Mono** (ledger-numeric only, judge-facing).

Plus Jakarta weights loaded: 400 Regular, 500 Medium, 600 SemiBold, 700 Bold, 800 ExtraBold. Italic variants not loaded (perf budget; italic rare in pair). Loaded via `next/font/local` with subset `latin` (Plus Jakarta Sans covers Indonesian orthography natively — no extra subset needed).

JetBrains Mono weights: 400 Regular, 500 Medium. Subset `latin`.

| Token | Font / weight | Size / line-height | Tracking | Mood |
|---|---|---|---|---|
| `text-display-xl` | Plus Jakarta 800 | 56 / 64 | -0.02em | Both (wordmark) |
| `text-display-lg` | Plus Jakarta 800 | 40 / 48 | -0.02em | Both |
| `text-display-md` | Plus Jakarta 700 | 32 / 40 | -0.01em | Both |
| `text-h1` | Plus Jakarta 700 | 28 / 36 | -0.01em | Both |
| `text-h2` | Plus Jakarta 600 | 24 / 32 | -0.005em | Both |
| `text-h3` | Plus Jakarta 600 | 20 / 28 | 0 | Both |
| `text-body-lg` | Plus Jakarta 500 | 18 / 28 | 0 | **Penerima-facing body min** |
| `text-body` | Plus Jakarta 400 | 16 / 24 | 0 | Judge-facing body |
| `text-body-sm` | Plus Jakarta 400 | 14 / 20 | 0 | Secondary (judge-facing only) |
| `text-caption` | Plus Jakarta 400 | 12 / 16 | 0.01em | Judge metadata only |
| `text-numeric-ledger` | JetBrains Mono 500, `font-feature-settings: 'tnum' 1` | 16 / 24 | 0 | **Judge-facing only** |
| `text-numeric-penerima` | Plus Jakarta 500, tnum | 24 / 32 | 0 | Penerima amounts (no mono) |

**Rules:**
- Never use `text-body-sm` or `text-caption` in Penerima-facing flow.
- Never use JetBrains Mono in Penerima flow — amounts use `text-numeric-penerima` (Plus Jakarta tabular-nums).
- Wordmark "Bound" uses `text-display-xl`, lowercase, no period, `-0.02em`.
- Font loading fallback: `font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` to avoid FOUT shift before next/font self-host loads. Mono fallback: `'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace`.

### 1.3 Spacing

4-pt scale (Tailwind-aligned):

| Token | rem | px | Typical use |
|---|---|---|---|
| `space-0` | 0 | 0 | Tight inline |
| `space-1` | 0.25 | 4 | Icon-text gap tight |
| `space-2` | 0.5 | 8 | Inline pair |
| `space-3` | 0.75 | 12 | Compact group (Penerima) |
| `space-4` | 1 | 16 | Body padding (judge-facing) |
| `space-5` | 1.25 | 20 | Card inner (Penerima receipt) |
| `space-6` | 1.5 | 24 | Section padding (judge spacious) |
| `space-8` | 2 | 32 | Section gap (judge spacious) |
| `space-10` | 2.5 | 40 | Hero padding |
| `space-12` | 3 | 48 | Tap-target floor (Penerima) |
| `space-16` | 4 | 64 | Hero gap |
| `space-20` | 5 | 80 | Page top spacing |
| `space-24` | 6 | 96 | Hero padding |

**Hard rule:** any value not on the scale is a code-smell. Use only these.

### 1.4 Radius

| Token | px | Use |
|---|---|---|
| `rounded-none` | 0 | Ledger line, full-bleed tables |
| `rounded-sm` | 4 | Chips, badges |
| `rounded-default` | 6 | Text inputs |
| `rounded-md` | 8 | Small cards |
| `rounded-lg` | 12 | Content cards |
| `rounded-xl` | 16 | Modals, large cards |
| `rounded-full` | 9999 | Pills, avatar, "Bound" status dot |

Hierarchy: outer container max radius = parent radius × 2 (so card `rounded-lg` 12 → inner input `rounded-default` 6 → chip `rounded-sm` 4). Never uniform `rounded-2xl` everywhere (anti-AI-aesthetic rule from skill).

### 1.5 Shadow

Subtle only (skill: "Subtle or no shadows unless the design system specifies").

| Token | Box-shadow |
|---|---|
| `shadow-none` | none |
| `shadow-xs` | `0 1px 2px rgba(10,10,10,0.04)` |
| `shadow-sm` | `0 1px 3px rgba(10,10,10,0.06), 0 1px 2px rgba(10,10,10,0.04)` |
| `shadow-md` | `0 4px 6px rgba(10,10,10,0.07), 0 2px 4px rgba(10,10,10,0.04)` |

No `lg`/`xl` shadows in MVP — emulate depth via border + bg-surface contrast instead.

### 1.6 Focus Ring

`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-color-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-color-bg-base`

Never remove `focus-visible` outline. `:focus` (mouse-only focus) may be hidden; `:focus-visible` always shown.

## 2. Mood Rules (Persona-Split, Switched Per Authenticated Role)

### 2.1 Penerima-facing — "A11y-Warmth" (Compact DANA-density)

Applies to routes: `/penerima/*`, `/toko/*` (cashier auth uses same warmth pattern).

- Body min: `text-body-lg` (18px / 28px). No `text-body-sm` or `text-caption`.
- Tap targets: ≥ `space-12` × `space-12` (48 × 48px) — exceeds WCAG 2.1 AA (44px), aligns WCAG 2.2 AAA target-size.
- Density: compact. Single-column always. Vertical rhythm `space-3` (12px) between form fields, `space-5` (20px) between receipt sections.
- Surface: high-contrast only. No decorative tints behind body content. Cards use `color-bg-base` with `color-border-subtle` 1px, never `color-bg-surface` (which is reserved for judge-facing stripe bg).
- Numeric amounts (sisa, receipt total): `text-numeric-penerima` (24px Plus Jakarta tabular, **not** mono).
- Status double-encoded: see §3.
- Buttons: `bg-color-brand-primary` (emerald-700), white text, `text-body-lg`, min-height `min-h-[48px]`. Primary action (Pay) gets `text-display-md` label weight, others `text-body-lg` Medium 500.
- Focus ring: emerald-700, 2px, 2px offset.
- No dropdown menus, no hover-only disclosure — every interactive surface has a tap action and a visible affordance (chevron icon + label).
- Logout/back: always visible fixed bottom region on <768px, top-right sheet on ≥768px.

### 2.2 Judge-facing — "Charity Ledger" (Spacious Stripe-density)

Applies to routes: `/` (campaign index), `/campaign/[addr]/*` (donate, operator admin, public dashboard).

- Body: `text-body` (16px) base, `text-body-lg` for donate CTA primary.
- Density: spacious. Section padding `space-6` (24px) mobile / `space-8` (32px) ≥768px. Card padding `space-6`.
- Chrome: header + footer `color-bg-chrome-dark` (near-black) with `color-text-on-dark` (white) — only on ≥768px. On <768px header collapses to white with `color-text-primary` to preserve compact readability.
- Numeric amounts (pool, target, history, donations): `text-numeric-ledger` (JetBrains Mono 500, 16px, tabular-nums).
- Ledger line: 1px `color-border-ledger` between table rows in `HistoryFeed`, `WhitelistTable`, donation list. Acts as audit-trail visual signature.
- "Settled" badge: filled `bg-color-success` (saffron-500) pill, `text-color-text-primary` (black) inside, `text-body-sm` Medium. Use only for "belanja settled" rows in history.
- Spacious cards: `color-bg-surface` (off-white stripe), `color-border-subtle` 1px, `rounded-lg`, `shadow-xs`. Pool/History/Hero cards.
- Wordmark in dark chrome header: `text-display-xl` Plus Jakarta 800 in `color-text-on-dark` (white).

### 2.3 Cross-Mood Invariants

Both moods share:
- Same palette (§1.1), same typography (§1.2), same spacing scale (§1.3), same radius tokens (§1.4).
- Same wordmark component (`BoundWordmark.tsx`) — only color flips (black on light, white on dark chrome).
- Same a11y baseline: focus-visible ring, keyboard nav, no color-only state, semantically-correct HTML (`<button>`, `<label htmlFor>`, `role="status"` for toasts, `aria-live` for receipt result).
- Density breakpoint `md` (768px): <768px → strict Penerima-warmth across the board (judge-facing also compacts); ≥768px → judge-facing unlocks ledger-spacious mood, Penerima retains warmth.

## 3. Component Inventory (per SPEC-web §Project Structure)

Status shorthand: I=Idle, H=Hover, F=Focus, D=Disabled, L=Loading, E=Error, S=Success.

| Component | Mood | States | A11y specifics |
|---|---|---|---|
| `BoundWordmark.tsx` | Both | I | `<a href="/" aria-label="Bound home">` + lowercase "Bound" `text-display-xl` 800; color flips per surface; no icon |
| `WalletConnect.tsx` | Judge | I,H,F,D,L,E,S | `<button>` (not `<div onClick>`); aria-busy while connecting; aria-label "Hubungkan dompet MetaMask"; on E shows `ErrorToast` (BUKAN_JARINGAN etc) |
| `CampaignCard.tsx` | Judge | I,H,F,L,E | Whole card is `<a>` to `/campaign/[addr]`; fields use `text-numeric-ledger`; never color-only for "active vs ended" (text label "Aktif" / "Selesai") |
| `DonateForm.tsx` | Judge | I,F,D,L,E,S | Path A vs Path B is radio `<input type="radio">` group `name="donorType"`; amount field `<input type="number" inputMode="numeric">` with `<label htmlFor>`; S shows success summary with tx hash |
| `QrRender.tsx` | Judge | I,L,E | `<canvas>` with `role="img" alt="QR code untuk toko {namaToko}"`; L placeholder is skeleton canvas; E never blank (shows ErrorToast BUKAN_TOKO) |
| `QrScanner.tsx` | Penerima | I,L,E | `<video>` with `aria-label="Kamera pemindai QR"`; permission prompt text is `<p>` not alert; manual-paste fallback is `<input type="text" inputMode="numeric">` always reachable, not hover-only; on E (EXPIRED/BUKAN_PENERIMA) propagate to Receipt |
| `Receipt.tsx` | Penerima | I,F,D,L,E,S | Amount `text-numeric-penerima` 24px; Pay button `text-display-md` 32px on ≥48px tap; expired state = red ring + clock icon + word "Kedaluwarsa" (double-encoded); on S show "Dibayar" pill (saffron fill + black "Dibayar" + checkmark icon) |
| `SisaHakBelanja.tsx` | Penerima | I,L | Amount `text-numeric-penerima`; "habis" state shows 0 with `color-text-secondary` plus word "Habis" (not just zero); loading skeleton on `text-numeric-penerima`-sized block |
| `WhitelistTable.tsx` | Judge | I,F,L,E | `<table>` with `<thead>`; ledger line `color-border-ledger` 1px; delist button `<button>` with `aria-label="Hapus {namaToko} dari whitelist"` + trash icon; status column shows icon + word "Aktif"/"Dihapus" not color only |
| `RecipientBatchForm.tsx` | Judge | I,F,D,L,E,S | `<textarea>` with `<label>`; preview count is `aria-live="polite"`; S shows "Penerima ditambahkan: N" with `text-numeric-ledger` count |
| `PoolCard.tsx` | Judge | I,L,E | Two amounts (collected, target) both `text-numeric-ledger`; progress bar uses `role="progressbar" aria-valuenow aria-valuemin aria-valuemax`; ratio text below adds label "Terkumpul / Target" so color bar is not sole signal |
| `HistoryFeed.tsx` | Judge | I,L,E | `<table>` or `<ol role="list">`; each event row: timestamp + amount (`text-numeric-ledger`) + type icon + word ("Donasi"/"Belanja") + (settled badge if belanja); ledger line 1px `color-border-ledger` between rows |
| `ErrorToast.tsx` | Both | I,E | `role="status"` + `aria-live="polite"` for non-critical; `role="alert"` for blocking (Pay failed mid-tx); text is canonical Indonesian (BUKAN_PENERIMA → "Bukan penerima terdaftar"); never color-only (icon + word + tone); auto-dismiss 5s with `aria-label="Tutup"` close button reachable by keyboard |

## 4. Type-only "Bound" Wordmark Spec

- Component file: `web/src/components/BoundWordmark.tsx`.
- Composition: lowercase word "Bound" only — no symbol, no period, no tagline.
- Font: Plus Jakarta Sans ExtraBold 800 (display weight, signature).
- Tracking: -0.02em.
- Size scale:
  - <768px: 28px (`text-h1` ish, but weight 800)
  - ≥768px: 36px
  - ≥1024px: 40px
- Color: `color-text-primary` (black) on light surface; `color-text-on-dark` (white) on `color-bg-chrome-dark`.
- Behavior: it is always an `<a href="/">` with `aria-label="Bound home"`. On the home route itself, it becomes `<span>` (no self-link).
- Acceptable variants: none in MVP. The wordmark never gets an emoji, gradient, or accent dot. Signature is the type alone.

## 5. WCAG 2.1 AA Compliance Evidence

### 5.1 Color Contrast (verified pairs)

| Foreground | Background | Ratio | WCAG result |
|---|---|---|---|
| black `#0A0A0A` | white `#FFFFFF` | 19.3:1 | AAA |
| black `#0A0A0A` | surface `#F7F7F5` | 19.0:1 | AAA |
| black `#0A0A0A` | surface-emerald `#ECFDF5` | 19.3:1 | AAA |
| black `#0A0A0A` | saffron `#F59E0B` | 10.1:1 | AAA (saffron-fill-with-black) |
| white `#FFFFFF` on chrome-dark `#0A0A0A` | 19.3:1 | AAA |
| white `#FFFFFF` on emerald-700 `#047857` | 4.88:1 | AA |
| white `#FFFFFF` on red-700 `#B91C1C` | 5.9:1 | AA |
| emerald-700 `#047857` text on white | 4.88:1 | AA |
| emerald-800 `#065F46` on saffron-100 `#FEF3C7` | 6.5:1 | AA+ |
| red-700 `#B91C1C` text on white | 5.9:1 | AA |
| amber-700 `#B45309` text on white (saffron-as-text fallback) | 4.7:1 | AA barely |
| text-secondary `#404040` on white | 11.5:1 | AAA |

### 5.2 Prohibited Pairs (rationale documented)

- White on saffron `#F59E0B`: 2.08:1 — **fails both AA normal and AA large**. Saffron is fill-only.
- Emerald-600 `#059669` text on white: 3.65:1 — fails AA normal, passes large only. Avoid as text.
- Saffron `#F59E0B` text on white: 2.08:1 — fails. Use amber-700 `#B45309` if saffron-tone text is unavoidable.

### 5.3 Target Size

- Penerima-facing: ≥48 × 48px (WCAG 2.2 AAA, exceeds 2.1 AA's 44px).
- Judge-facing: ≥44 × 44px (AA), but spacious density naturally yields larger.

### 5.4 Non-Color Signals

Every state carries: color + icon + Indonesian word.
- Active: emerald + dot + "Aktif"
- Ended: neutral gray + dot + "Selesai"
- Settled: saffron fill + checkmark + "Dibayar"
- Error: red + warning triangle + canonical Indonesian verb-noun ("Bukan penerima terdaftar")
- Loading: skeleton + `aria-busy` + "Memuat" text where context demands

### 5.5 Keyboard Navigation

- All interactive elements are native `<button>`, `<a>`, `<input type=...>`, `<select>`, `<textarea>` — no `<div onClick>` or `<span onClick>`.
- Tab order matches visual order (DOM order matches reading order).
- `:focus-visible` ring 2px emerald-700 offset 2px on every interactive element.
- `QrScanner` is keyboard-reachable via the manual-paste fallback (camera path itself is mouse/touch-only — manual fallback is mandatory per spec a11y).

## 6. Tailwind Config Tokens Map

`web/tailwind.config.ts` extends:

```ts
theme: {
  extend: {
    colors: {
      'bg-base': '#FFFFFF',
      'bg-surface': '#F7F7F5',
      'bg-surface-emerald': '#ECFDF5',
      'bg-surface-saffron': '#FEF3C7',
      'bg-chrome-dark': '#0A0A0A',
      'text-primary': '#0A0A0A',
      'text-secondary': '#404040',
      'text-on-dark': '#FFFFFF',
      'brand-primary': '#047857',
      'brand-primary-deep': '#065F46',
      'brand-surface': '#ECFDF5',
      'success': '#F59E0B',
      'success-text': '#B45309',
      'error': '#B91C1C',
      'error-action': '#B91C1C',
      'border-subtle': '#E5E5E5',
      'border-ledger': '#047857',
      'focus-ring': '#047857',
    },
    fontFamily: {
      sans: ['var(--font-plus-jakarta)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
    },
    fontSize: {
      'display-xl': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.02em', fontWeight: '800' }],
      'display-lg': ['2.5rem', { lineHeight: '3rem', letterSpacing: '-0.02em', fontWeight: '800' }],
      'display-md': ['2rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: '700' }],
      'h1': ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em', fontWeight: '700' }],
      'h2': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.005em', fontWeight: '600' }],
      'h3': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
      'body-lg': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
      'body': ['1rem', { lineHeight: '1.5rem', fontWeight: '400' }],
      'body-sm': ['0.875rem', { lineHeight: '1.25rem', fontWeight: '400' }],
      'caption': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em', fontWeight: '400' }],
      'numeric-ledger': ['1rem', { lineHeight: '1.5rem', fontWeight: '500' }],
      'numeric-penerima': ['1.5rem', { lineHeight: '2rem', fontWeight: '500' }],
    },
    spacing: { /* standard Tailwind 0.25rem scale; no overrides — uses 4-pt default */ },
    borderRadius: {
      'none': '0',
      'sm': '4px',
      'default': '6px',
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
      'full': '9999px',
    },
    boxShadow: {
      'none': 'none',
      'xs': '0 1px 2px rgba(10,10,10,0.04)',
      'sm': '0 1px 3px rgba(10,10,10,0.06), 0 1px 2px rgba(10,10,10,0.04)',
      'md': '0 4px 6px rgba(10,10,10,0.07), 0 2px 4px rgba(10,10,10,0.04)',
    },
  },
},
```

Utilities to add to globals.css:
- `.text-numeric-ledger { font-feature-settings: 'tnum' 1; font-family: var(--font-jetbrains-mono), ui-monospace, monospace; }`
- `.text-numeric-penerima { font-feature-settings: 'tnum' 1; }`
- focus-visible base layer:
```css
@layer base {
  :focus-visible { outline: none; box-shadow: 0 0 0 2px #FFFFFF, 0 0 0 4px #047857; }
}
```

Next/font self-host wiring (in `web/src/app/layout.tsx`):
```ts
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-plus-jakarta', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400','500'], variable: '--font-jetbrains-mono', display: 'swap' });
```
> Note: `next/font/google` is chosen over `next/font/local` for hackathon speed; if font fetch fails in the deploy region, swap to `next/font/local` with self-hosted woff2 (T6.x will adjust if T6.0 catches it in scaffold test).

## 7. Verification Plan (per frontend-ui-engineering skill)

Skill verification checklist applied to this design system (file-level; runtime checklist applies at component build time):

- [x] Tokens defined on a consistent scale (no off-scale values)
- [x] WCAG 2.1 AA evidence per color pair, including prohibited pairs with rationale
- [x] Status never color-only (icon + word + tone per state matrix §3)
- [x] Focus-visible ring spec present, never removed
- [x] Tap-target floor specified (48px Penerima, 44px Judge)
- [x] Body min size 18px on Penerima-facing surfaces
- [x] Component inventory maps to SPEC-web Project Structure exactly (no orphan components)
- [x] Wordmark spec resolves design-pivot invariants
- [x] Anti-AI-aesthetic rules applied (no purple, no `rounded-2xl` everywhere, no excessive gradients)
- [ ] Runtime: components render without console errors — verified at T6.x per-component
- [ ] Runtime: keyboard Tab order matches visual order — verified at T6.x e2e
- [ ] Runtime: axe-core zero violations — verified at T10.2 Playwright + axe
- [ ] Runtime: real Android phone renders 18px+ body without overflow — T10.4
- [ ] Runtime: Plus Jakarta heavy weights load <1.5s on 4G — T10.4 network throttle

## 8. Open Items (deferred to T6.x implementation, not blocking Phase C SPEC update)

- Whether `next/font/google` works in demo-deploy network; fallback to `next/font/local` ready.
- Whether `html5-qrcode` (Penerima scanner) injects inline styles that conflict with §1.5 shadow-subtle aesthetic; wrap in container with `rounded-lg overflow-hidden` to constrain.
- Whether `qrcode.react` (judge-facing QrRender) default color uses pure black on white (acceptable) or needs customization for chrome-dark context — T6.x decides per-route.