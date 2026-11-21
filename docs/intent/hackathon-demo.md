# Statement of Intent: Bound — Hackathon Demo Build

> Confirmed via `interview-me` (explicit "yes" from Elmyra), 2026-11-07.

## The Intent

- **Outcome:** Build and ship Bound's working testnet MVP — contracts, relayer, web — so the 5-minute demo script (PRD §9) runs live and clean at the campus hackathon's demo day.
- **User:** Hackathon judges (campus, Indonesian, Web3 theme, live demo day) — demo-first audience. Proposal stage already passed with prd.md-equivalent scope (pitch-level adjustments only, no material deltas). Secondary users: the builders themselves.
- **Why now:** Demo day is the one remaining gate after the cleared proposal stage.
- **Success:** PRD §10 — donation→pool→redemption completes on testnet; scan→confirm <30s; zero free-transfer paths (contract + UI); judges can read pool, disbursed, whitelist, and history from chain. PRD §9 negative paths (`EXPIRED`, `BUKAN_PENERIMA`, `BUKAN_WHITELIST` post-delist) all revert on cue.
- **Constraint:** Solo build (user + agent, no other humans). Chain choice is ours to make — Base Sepolia is the default candidate, revisitable on merit (AI recommendation, not sponsor mandate; hackathon is not Base-sponsored). MVP testnet only. With no fixed deadline, scope discipline comes from the PRD baseline, not a clock.
- **Out of scope:** PRD §11 verbatim (real-money stables, fiat/QRIS/bank rails, in-app swap widget, native mobile, indexer, AA paymaster, IPFS, NIK/DTSEN/gov integration, audit-grade security). No proposal-rewrite deliverable — that stage is won. PRD §11 stays gospel.

## Build Context (interview facts)

| Fact | Value |
|---|---|
| Project/app name | **Bound** (canonical; see `CONTEXT.md`) |
| Event | Indonesian campus hackathon, Web3 theme |
| Judging | Live demo day (5-minute demo, PRD §9 script) |
| Proposal stage | Passed already, via separate doc derived from `prd.md`; pitch-level tweaks only |
| Build baseline | `prd.md` in repo + `CONTEXT.md` language |
| Team | Solo: user + opencode agent |
| Deadline | None fixed; steady build toward demo day |
| Stale-reference note | PRD §12 says `.scratch/hacksphere-mvp/` — old codename; pending decision to rename to `.scratch/bound-mvp/` |

## Downstream

- Phase 0 approved 2026-11-07: capability map saved at `CAPABILITY_MAP.md` (`contracts` → `relayer` → `web`); PRD §12 appendix updated.
- Phase 1 (Specify) complete 2026-11-21: all three module specs written and frozen with operator-approved decisions — `SPEC-contracts.md` (incl. `setPenerimaBatch` patch), `SPEC-relayer.md`, `SPEC-web.md`.
- Phase 2 (Plan) complete 2026-11-21: `tasks/plan.md` + `tasks/todo.md` frozen with operator decisions (Q-1..Q-4 + faucet-embedded addendum T5.3 added after gap discovered during Q-4 review).
- Phase 3 (Tasks) complete 2026-11-21: 28 tasks across 3 phases in `tasks/todo.md`.
- Phase 4 (Implement) held by operator until explicit "mulai build" signal.
