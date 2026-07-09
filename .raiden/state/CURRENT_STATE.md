# merlins_cloak — Current State

This file is a current-facts-only snapshot. It is overwritten, not appended.
When a fact stops being true it is deleted, not struck through or superseded.

## What This Is

A Violentmonkey/ScriptCat userscript (`asus-merlin-ui.user.js`) that re-themes
the AsusWRT-Merlin router web UI entirely client-side — no firmware
modification, no SSH. Target hardware: Asus RT-BE92U, firmware
`3006.102.7_2` and compatible. Two major capabilities: the **Fujin dark
theme** (full stylesheet override driven by the Fujin design-system token
map — a cross-repo asset dependency on the Fujin Instance) and a
**widescreen layout** pass (content wrappers filled to the widened column,
charts protected).

## Where It Stands

- Theme + layout completion run finished and verified end-to-end 2026-06-21
  (computed-style audit across ~70 pages + native ScriptCat injection
  confirmation) — see `HANDOFF_FUJIN_THEME.md` at the repo root.
- Development continued through v4.6.x (scrollbars, footer alignment,
  responsive grid, GitHub auto-update URLs) — see `git log` and
  `CHANGELOG.md`.
- README/CHANGELOG documentation of the theme/widescreen work landed
  2026-07-09 at operator instruction (commit `79ff8f8`).
- Enrolled as a **ledger-form RAIDEN Instance** 2026-07-09 (D-001,
  Raiden-ops:OPS-D-002); registered in the ops registry.

## Live Surfaces To Know About

- Root `CLAUDE.md` — the project's own agent instructions (pre-RAIDEN
  convention, deliberately untouched by enrollment).
- `HANDOFF_*.md` series — the project's own session-handoff convention;
  `HANDOFF_FUJIN_THEME.md` is the most recent and most complete record.

## Open Work

See OPEN_LOOPS.md (LOOP-001, LOOP-002).
