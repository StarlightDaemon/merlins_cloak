# RAIDEN State — merlins_cloak (ledger form)

This directory is the live continuity state of a **ledger-form RAIDEN
Instance**: state files + instance metadata only — no Writ, no baseline, no
managed hook (see the framework's `toolkit/instance/STRUCTURE.md`, Ledger
Form). Upgrade to a full Instance is the normal install and a future operator
decision (D-001).

Read order: `CURRENT_STATE.md` → `OPEN_LOOPS.md` → `DECISIONS.md`.
`WORK_LOG.md` holds dated history. Loop status lives only in
`OPEN_LOOPS.md`; volatile counts only in dated work-log entries; no
hand-written date footers (freshness is derived from git).

This repo's pre-existing conventions (root `CLAUDE.md`, `HANDOFF_*.md`
files) are deliberately untouched by the ledger enrollment; they remain the
project's own surfaces until/unless a full install imposes the managed
rules.
