# Work Log — merlins_cloak

Dated entries, newest last. Volatile counts and version mentions live here,
inside dated entries, per the fact-home discipline.

## 2026-07-09 — enrolled as ledger-form RAIDEN Instance

- Operator committed the outstanding documentation WIP first (commit
  `79ff8f8`: README rewrite documenting the Fujin theme/widescreen work,
  CHANGELOG entries 4.4.1–4.5.7, `.serena/` gitignored) — disposition of a
  Report-and-Hold on the enrollment's first attempt.
- Ledger seeded from repo evidence: README, `HANDOFF_FUJIN_THEME.md`
  (2026-06-21 completion report), CHANGELOG, and git history (v4.6.1 at
  `7083518` was the latest release commit at enrollment).
- LOOP-001/LOOP-002 imported from the README Roadmap; no other pending
  threads found in the latest handoff (it self-describes as COMPLETE).
- `.raiden/instance/metadata.json` written (`instance_form_type: ledger`,
  `state_schema_version: 2`).

## 2026-07-09 — LOOP-001 reconciled closed, LOOP-002 fallback implemented

- LOOP-001 reconciled against `HANDOFF_FUJIN_THEME.md`: the 2026-06-21
  completion run audited all four roadmap-named areas (Wireless, VPN,
  AiMesh, diagnostic pages) by name across ~70 pages; 5 fix commits
  (`2ff48b8`, `767f251`, `6552944`, `3ce1201`, `09ce486`) confirmed present
  on `main` and in the shipped script (grep-verified for their added
  selectors: `.ui-slider`, `.navtext`, `.clientBg`, `.Bar_container`,
  `color-scheme:dark`). No genuinely outstanding roadmap-scope pages found.
  Closed as already-covered; README roadmap item checked off; CLAUDE.md
  Open Loops section updated to match.
- LOOP-002 implemented: `watchStatusframe()` gained a `MutationObserver`
  on `#statusframe`'s `src` attribute (staggered 100/500/1500ms retries of
  the existing idempotent `onLoad()`), targeting the confirmed
  `statusframe.src = ""` reset in `RAW/index.asp`. Verified: `node --check`
  syntax pass, ES5-style walkthrough, idempotency of downstream calls. Not
  verified: live-router/live-injection behavior (no router available to
  this agent) — status recorded as implemented, pending live verification
  rather than closed.
- LOOP-002 hardening (same day, follow-up commit): a verification probe
  found the first cut's boolean burst gate dropped a second src mutation
  landing mid-burst — the router's real reset is two mutations (src=""
  then reassignment), so the one that matters could be missed. Reworked to
  cancel-and-restart (each mutation clears pending retry timers and arms a
  fresh 100/500/1500ms burst; bounded, terminates 1500ms after the last
  mutation); scheduling function hoisted out of the `if` block for strict
  ES5 grammar. `@version` 4.6.2 → 4.6.3. Re-verified: `node --check` pass,
  ES5 construct scan clean, logic walkthrough. Live verification still
  pending; loop status unchanged.
