# Merlin's Cloak

A Violentmonkey userscript that re-themes the AsusWRT-Merlin router web UI — no firmware modification, no SSH, no JFFS scripts required. Everything runs client-side in your browser.

**Target hardware:** Asus RT-BE92U  
**Firmware:** AsusWRT-Merlin `3006.102.7_2` and compatible  
**Status:** Active development — dark theme broadly applied; per-settings-page coverage ongoing

---

## What It Does

### Fujin Dark Theme
Injects a full dark theme stylesheet (`#fujin-theme`) that overrides every major Merlin CSS selector: backgrounds, surfaces, borders, text, inputs, buttons, tabs, form tables, status panel blocks, and navigation. All colors come from the Fujin design system token map, sourced from the router's own CSS files. All border-radius values are zero (Fujin `tokens.radius.default = 0`).

### Widescreen Layout
Expands the fixed 998px layout to `80vw` (clamped between 998px and 1600px), giving ~40–60% more usable width on 1920px+ displays. The sidebar stays pinned at 204px; the content column gets the remaining space.

### Topology Strip
On the home page, reshapes the stock vertical network map into a horizontal card strip. Five equal-width nodes read left-to-right: Internet → Router → Clients / AiMesh / USB. Connector rows are hidden; the router's JS continues to update node content and status icons.

### Dynamic Statusframe Height
The System Status iframe height is driven by a CSS custom property (`--fjn-sf-h`) fed by a height reporter inside the iframe. The reporter uses a MutationObserver to track content changes and writes the measured height back to the top document. The stylesheet pin (`height:var(--fjn-sf-h) !important`) keeps the router's own `set_NM_height()` writes inert.

### Settings Panel
A `[=]` button (fixed, top-right of every page) opens a dark overlay with three independent toggles:

| Toggle | Default | Effect |
|--------|---------|--------|
| Fujin Theme | On | Dark theme stylesheet |
| Widescreen Layout | On | 80vw layout + topology strip |
| Hide View List Button | On | Hides the modal View List button in the network map |

Each toggle saves to GM storage (or localStorage) and reloads the page. The same toggles are available in the userscript manager popup via `GM_registerMenuCommand`.

---

## Requirements

- [Firefox](https://www.mozilla.org/firefox/) (recommended) or any browser with userscript support
- [Violentmonkey](https://violentmonkey.github.io/) browser extension

---

## Installation

1. Install [Violentmonkey](https://violentmonkey.github.io/) for your browser
2. Click the link below to install the script directly, **or** open Violentmonkey, click the **+** button, and paste the raw script contents:

   **[Install asus-merlin-ui.user.js](https://raw.githubusercontent.com/StarlightDaemon/merlins_cloak/main/asus-merlin-ui.user.js)**

3. Violentmonkey will show a confirmation screen — click **Confirm Installation**
4. Navigate to `http://192.168.1.1` (or your router's IP) and log in

> **Important:** Always delete the old script in Violentmonkey and reinstall fresh when updating. VM can cache stale compiled versions and editing in place may not take effect.

---

## Compatibility

| Router | Firmware | Status |
|--------|----------|---------|
| RT-BE92U | Merlin 3006.102.7_2 | Tested, working |
| Other Merlin devices | Recent Merlin | Likely compatible — DOM structure is consistent across models |

The script targets standard Merlin UI DOM structure. Stock AsusWRT (non-Merlin) may work but is untested.

---

## Technical Notes

The Merlin UI is a table-based XHTML layout from circa 2015 running in Almost Standards Mode. The script is written in strict ES5 for compatibility with the embedded browser context Violentmonkey injects into. No ES6+ features (arrow functions, template literals, const/let, etc.) are used.

The router's own JavaScript sets inline styles with plain `element.style.width = '...'` writes. Author stylesheet rules with `!important` beat plain inline styles, so no JS-based re-application timers are needed for layout. JS is used only for things CSS cannot do: removing HTML attributes, tagging layout roles with `fjn-*` classes, and measuring iframe content height.

---

## Roadmap

- [ ] Complete per-settings-page theme coverage (Wireless, VPN, AiMesh subpages, diagnostic pages)
- [ ] Statusframe timing: MutationObserver fallback for edge-case iframe load events

---

## License

MIT License - see [LICENSE](LICENSE)
