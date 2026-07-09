# Open Loops — merlins_cloak

Numbered LOOP-xxx; IDs never reused; closed loops retained.

## LOOP-001

- Title: Complete per-settings-page theme coverage
- Status: Open
- Gate: none
- Why it matters: the README roadmap lists remaining per-settings-page
  coverage (Wireless, VPN, AiMesh subpages, diagnostic pages). Imported from
  the README Roadmap at enrollment (2026-07-09). Note: the 2026-06-21
  completion run (`HANDOFF_FUJIN_THEME.md`) reports all *identified* gaps
  fixed across ~70 audited pages — this loop covers whatever the roadmap
  still considers outstanding beyond that audit; reconcile against the
  handoff before starting work.
- Success condition: the roadmap item is either completed and checked off in
  the README or explicitly closed as already-covered by the 2026-06-21 audit.

## LOOP-002

- Title: Statusframe timing — MutationObserver fallback
- Status: Open
- Gate: none
- Why it matters: edge-case iframe load events can miss the statusframe
  injection window; the README roadmap calls for a MutationObserver
  fallback. Imported from the README Roadmap at enrollment (2026-07-09).
- Success condition: fallback implemented and verified on the statusframe
  edge cases, or the item is closed with a recorded reason.
