# CONTEXT.md — Bound

Product/app name: **Bound**. Use this name everywhere (UI, spec, code, pitch); do not rename per feature or per audience.
One-liner: programmable donations — money converts into non-transferable spending rights redeemable only at whitelisted stores.

## Canonical domain terms

Canonical names are Indonesian (target-audience language). Use them in the proposal, UI, and code naming; avoid the listed synonyms.

- **Kampanye (Campaign):** a single fundraising drive with its own recipient list, store whitelist, and quota. Example: "Banjir Demak 2025". Avoid: ~~bansos~~.
- **Donatur (Donor):** anyone who donates to a Campaign pool. Permissionless. Avoid: ~~donor~~ (in prose; acceptable only in identifiers).
- **Penerima (Recipient):** a person granted spending rights in a Campaign, not free cash. Allowlisted by the operator. Avoid: ~~beneficiary~~, ~~KPM~~.
- **Hak Belanja (Spending right):** a non-transferable balance owned by a Penerima, spendable only via whitelisted checkout. Avoid: ~~balance~~, ~~token~~, ~~voucher~~.
- **Toko Whitelist (Whitelisted store):** a store approved in a Campaign to receive Hak Belanja and settle funds. Registered by the operator as `name + address` (`1 address per store`). Avoid: ~~merchant~~, ~~vendor~~.

## Role vocabulary

| Role | Meaning |
|---|---|
| Operator | Campaign creator; registers Toko Whitelist first, then Penerima; pays relayer gas tank |
| Relayer | Backend that logs Penerima in, holds custodial wallets, submits sponsored-gas `belanja()` |
| Pengecer-style checkout aka "Create QR" | Toko Whitelist screen generating a dynamic QR `{campaign, merchant, amount, 5-min expiry, one-time nonce}` |

## Naming rules

- Contract/UI identifiers may use English (`donasi()`, `belanja()`, `isPenerima`, `isWhitelist`) exactly as specified in the PRD business rules; do not invent new synonyms for them.
- Error strings are canonical Indonesian uppercase: `BUKAN_PENERIMA`, `BUKAN_WHITELIST`, `JATAH_HABIS`, `POOL_HABIS`, `LIMIT`, `EXPIRED`, `NONCE_DIGUNAKAN`.
- Demo fixture names (Ani/Budi/Citra, "Banjir Demak") are canonical for the 5-minute demo script.
