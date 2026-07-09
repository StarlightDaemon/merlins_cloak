# Open Loops — merlins_cloak

Numbered LOOP-xxx; IDs never reused; closed loops retained.

## LOOP-001

- Title: Complete per-settings-page theme coverage
- Status: Closed (2026-07-09)
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
- Closure note: reconciled against `HANDOFF_FUJIN_THEME.md` — the 2026-06-21
  run audited all four roadmap-named areas by name (Wireless all tabs, VPN
  all tabs, AiMesh, System Log/Network Tools) across ~70 pages with a live
  computed-style auditor and landed 5 fix commits (`2ff48b8`, `767f251`,
  `6552944`, `3ce1201`, `09ce486`), all confirmed present on `main` and in
  the shipped script (verified by grep for their added selectors). The only
  documented residual is a cosmetic, non-blocking item (thin class-less
  divider lines on the Notification page) explicitly left as-is, not an
  outstanding coverage gap. Closed as already-covered; README roadmap item
  checked off in the same commit.

## LOOP-002

- Title: Statusframe timing — MutationObserver fallback
- Status: Implemented, pending live verification (2026-07-09)
- Gate: live-router verification (no router available to this agent)
- Why it matters: edge-case iframe load events can miss the statusframe
  injection window; the README roadmap calls for a MutationObserver
  fallback. Imported from the README Roadmap at enrollment (2026-07-09).
- Success condition: fallback implemented and verified on the statusframe
  edge cases, or the item is closed with a recorded reason.
- Implementation note: `watchStatusframe()` in `asus-merlin-ui.user.js` now
  also observes `#statusframe`'s `src` attribute with a `MutationObserver`
  and re-runs the idempotent `onLoad()` handler on staggered retries
  (100ms/500ms/1500ms) when it fires. This directly targets the confirmed
  router behavior in `RAW/index.asp` (`statusframe.src = ""` then
  reassigned when `flag == "Internet" || flag == "Client"`), the exact
  scenario the original open-loop note called out. Verification-probe
  hardening (same day): the first cut gated the burst with a boolean, so a
  second mutation landing mid-burst (the src reassignment — the navigation
  that matters) was silently dropped. Reworked to cancel-and-restart: each
  mutation clears any outstanding retry timers and arms a fresh
  100/500/1500ms burst, so every mutation gets a full retry window while
  retries stay bounded (max 3 pending timers, terminating 1500ms after the
  last mutation). The scheduling function was also hoisted out of the `if`
  block to top-level `watchStatusframe()` scope for strict-ES5 grammar
  cleanliness. Verified: `node --check` syntax pass, no ES5-forbidden
  constructs (matches existing file style), and a code-level walkthrough
  confirming `onLoad()`/`injectStyleEl()`/`attachHeightReporter()` are all
  no-ops on redundant calls so extra retries are safe. NOT verified: actual
  behavior against a live router or a real Violentmonkey/ScriptCat
  injection context (no router available to this agent) — status
  intentionally left short of Closed per the honesty-first convention until
  an operator confirms live.
