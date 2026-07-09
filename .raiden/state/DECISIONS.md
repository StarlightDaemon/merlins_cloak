# Decisions — merlins_cloak

Append-only. D-xxx numbering local to this repo; cross-repo citations use
the `<RegistryName>:D-xxx` form.

## D-001

- Date: 2026-07-09
- Decision: merlins_cloak is enrolled as a **ledger-form RAIDEN Instance**
  per Raiden-ops:OPS-D-002 — state files + instance metadata only; no Writ,
  no baseline, no managed hook. The repo's pre-existing conventions (root
  `CLAUDE.md`, `HANDOFF_*.md` series) are deliberately left untouched by
  this enrollment. Promotion to a full Instance is the normal install and a
  future operator decision, to be taken after the project's own conventions
  are properly reviewed.
