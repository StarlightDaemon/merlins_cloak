# CLAUDE.md — Merlin's Cloak Session Anchor

Persistent context for any Claude Code session in this repo. Read this first.

---

## What This Is

**Merlin's Cloak** is a Violentmonkey userscript that re-themes and reorganizes the AsusWRT-Merlin router admin UI at `http://192.168.1.1`. No firmware changes, no SSH — pure client-side browser injection.

Target: **Asus RT-BE92U**, firmware **Merlin 3006.102.7_2**.

One file ships: `asus-merlin-ui.user.js`.

---

## Key Files

| Path | Purpose |
|---|---|
| `asus-merlin-ui.user.js` | The userscript — the only deliverable |
| `RAW/*.css` | Live CSS pulled from the router — authoritative color source |
| `RAW/index.asp` | Router home page source (structural reference) |
| `RAW/appGet.cgi` | Router API response format reference |
| `RAW/state.js` | Status iframe data format reference |
| `CHANGELOG.md` | Version history |

Fujin design system lives at **`/Users/dante/Citadel/Fujin`** — `tokens.json` is the token contract.

---

## Design Contract

All color and typography in this script follows the Fujin design system:

1. **Zero border-radius everywhere.** `tokens.radius.default = 0`. The router's own CSS uses rounded corners throughout — override them all with `border-radius:0 !important`. No exceptions.
2. **All colors via `FUJIN.*` constants.** The `FUJIN` object at the top of the script is the single source of truth. No raw hex literals anywhere in the code.
3. **The `FUJIN` token values were sourced from `RAW/*.css`** — not invented. Every value traces to a specific selector in the router's own stylesheet.
4. **Typography from `tokens.json`:** `fontBase` uses Verdana as the first font (matches the router's own font); `fontMono` uses JetBrains Mono.
5. **Strict ES5.** No `const`/`let`, no arrow functions, no template literals, no `class`. Violentmonkey injects into an iframe context — ES5 is the safe floor.
6. **No external dependencies.** No CDN, no fetch to third parties. Everything is self-contained.

---

## Theme vs Customization — Cliff Notes (since v3.3.0)

The project is two separable layers. **The theme is the goal; the customizations are optional reshaping of the stock UI.** Every customization is now an independent toggle, so the theme can be perfected against the *default* Asus layout.

**Toggle a feature:** settings panel (`[=]` button, top-right) or the GM/userscript-manager menu. Each toggle is a key in `SETTINGS_DEFAULTS`; all default `true` (first-install behavior unchanged).

**One-click presets** (settings panel, above "Reset to defaults"):
- **Theme only (stock layout)** → `applyPreset(PRESET_THEME_ONLY)` — theme on, *all* layout customizations off. Use this to work on the theme against the unmodified router UI.
- **Full customization** → `applyPreset(SETTINGS_DEFAULTS)` — everything on.

| Layer | Toggle key | What it does | Function |
|---|---|---|---|
| **THEME** | `theme` | Fujin colors/fonts/zero-radius (pure styling, no layout/hiding rules) | `injectFujinStyle` / `buildFujinCSS` |
| CUSTOMIZATION | `fluidLayout` | Full-stretch layout + centered home diagram | `patchFluidLayout` + fluid CSS block |
| CUSTOMIZATION | `menuReorder` | 3-section sidebar grouping | `buildMenu` |
| CUSTOMIZATION | `clientList` | Custom Client List menu item + grid (also gates `patchGoToPage`) | `injectClientListMenuItem` |
| CUSTOMIZATION | `routerInfo` | Op-mode + firmware block in statusframe | `injectRouterInfoIntoIframe` |
| CUSTOMIZATION | `logoLink` | Wraps logo in home link | `makeLogoLink` |
| HIDE (header) | `hideTitleDownBar` | Hides titledown bar | `hideTitleDown` (self-gates) |
| HIDE (header) | `hideMerlinLogo` | Hides Merlin logo | `hideTitleDown` (self-gates) |
| HIDE (home) | `hideViewListBtn` | Hides View List button | `hideNetworkMapCards` (self-gates) |
| HIDE (home) | `hideUsbCard` | Hides USB card on network map | `hideNetworkMapCards` (self-gates) |
| HIDE (home) | `hideAimeshCount` | Hides AiMesh node count | `hideNetworkMapCards` (self-gates) |
| HIDE (menu) | `hideAiProtection`/`hideParental`/`hideUsb`/`hideAlexa`/`hideQis` | Hide individual menu items | `getHideIds` → `hideMenuItems` |

**Release principle (v3.4.0):** NOTHING is hidden permanently. Every hidden default element has its own independent toggle — `hideTitleDown()` and `hideNetworkMapCards()` self-gate each element rather than bundling. When adding any new hide, give it its own `SETTINGS_DEFAULTS` key + `SETTING_ROWS` entry + `PRESET_THEME_ONLY: false` line. No exceptions — this is required for the public release's optionality guarantee.

**Known coupling (low priority):** the `fluidLayout` *CSS* block lives inside `buildFujinCSS`, which only injects when `theme` is on. So `fluidLayout` on + `theme` off = JS widths apply but CSS rules don't. Irrelevant for "Theme only" (theme is on); fix later if fluid-without-theme is ever wanted.

---

## Current State — v3.0.0

What `asus-merlin-ui.user.js` does:

### Theme injection (new in v3.0.0)
- `FUJIN` token map — 30 named constants covering all background layers, surfaces, borders, text roles, accents, connection badge colors, and typography
- `buildFujinCSS()` — builds a stylesheet covering every Merlin CSS selector that needs overriding, using CSS custom properties defined on `:root` (`--fjn-*`)
- `injectFujinStyle(doc)` — appends `<style id="fujin-theme">` to any document; idempotent
- Called on `document` at script init, and on `statusframe.contentDocument` when the iframe loads

### Menu overhaul
- Rebuilds sidebar into three labeled sections: General / Network Settings / System Tools
- Hides five items by default (AiProtection, Parental Controls, USB App, Alexa, QIS)
- Custom "Client List" menu item injected between Network Map and AiMesh
- Logo image wrapped in `<a href="index.asp">` for home navigation
- Titledown bar and Merlin logo overlay hidden

### Client List grid
- Full-page card grid embedded in the content area (replaces the modal-based default)
- Filter tabs: All / Wired / Wireless
- Search by name, IP, MAC, vendor
- Color-coded connection badges: blue=Wired, green=2.4G, orange=5G, purple=6G
- Sorted by IP address
- All colors from `FUJIN.*`, zero border-radius

### Router Info in status panel
- Injects Operation Mode + Firmware version into the statusframe iframe as a `.unit-block`

---

## FUJIN Token Reference

Full `FUJIN` object as defined in the script (source selectors from `RAW/*.css`):

```javascript
// Page-level backgrounds (dark → light)
bgPage:    '#21333e'   // body bg
bgDark:    '#1f2d35'   // FormTable th, top-input
bgStatus:  '#2a3539'   // statusbody, NM containers
bgOverlay: '#2b373b'   // pop_div_bg, floating panels
bgTitle:   '#2f3a3e'   // .tab, .tm_title_bg
// Surfaces
navBg:     '#3a4042'   // .menu, .control_bg
blockBg:   '#444f53'   // .block_bg, port status panels
contentBg: '#4d595d'   // .tabClicked, .content_bg, FormTitle thead
cellBg:    '#475a5f'   // .FormTable td, .textarea_bg
inputBg:   '#596e74'   // .input_*_table, clientIcon
// Borders
borderDark:  '#222'      // FormTable td inner borders
borderMenu:  '#6b7071'   // .menu, .menu_Split
borderInput: '#929ea1'   // .input_*_table
borderCard:  '#3a4042'   // card separation (= navBg)
// Text
textPrimary:   '#ffffff'
textSecondary: '#93a9b1'  // .tab_font_color
textMuted:     '#667881'
textLink:      '#569ac7'  // .clients span, .style1, .NMitem a
textHint:      '#ffcc00'  // .hint-color, FormTable td span
// Accents
accentHover:  '#77a5c6'  // .menu:hover
accentBtn:    '#09639c'  // .button_gen:hover gradient start
accentBright: '#248dff'  // scrollbar thumb
// Connection badges
wired: '#4a9eff'  ghz24: '#44cc88'  ghz5: '#ffaa33'  ghz6: '#cc44ff'
```

---

## Open Loops / What's Next

These items are not done. Check `CHANGELOG.md` and `README.md` for full history before starting any of them.

1. **Sidebar background fill** — the sidebar (`#mainMenu`) doesn't extend all the way to the footer on short pages. The `min-height:100%` approach is partially working; the underlying issue is the table layout on `index.asp`. Investigate `td#mainMenu` vs its parent `<table>` height constraints.

2. **Offline devices tab in Client List grid** — the grid currently only shows online devices (`if (!c.isOnline) { continue; }`). Add an "Offline" tab and render offline clients in a visually subdued style (lower opacity, no connection badge).

3. **Refresh button in Client List grid** — the grid has no visible refresh control. Add one next to the search input; wire it to `window.refreshClientGrid()`.

4. **Settings pages audit** — the Fujin injection covers the main structural selectors, but there are edge cases on specific settings pages (e.g., Wireless, VPN client config) that may still have unstyled elements. Test on each page and add targeted overrides to `buildFujinCSS()` as needed.

5. **`other.css` coverage** — diagnostic/error pages (`other.css` in RAW) weren't covered by the initial injection pass. Lower priority; add if needed.

6. **Statusframe iframe timing** — the current `tryInject` retry loop polls every 300ms up to 20 times. On slow page loads this can miss. Consider using a `MutationObserver` on the iframe body instead.

7. **README and CHANGELOG** — update after any significant work. Keep `CHANGELOG.md` entries consistent with the existing format (semver + date).

---

## How to Test

1. Open `asus-merlin-ui.user.js` in Violentmonkey's editor (or delete old version and reinstall from file)
2. Navigate to `http://192.168.1.1`
3. Open DevTools → check `<head>` for `<style id="fujin-theme">` to confirm injection
4. Check console for any errors from `buildClientGrid` or `injectFujinStyle`
5. Navigate to several settings pages (Wireless, LAN, VPN) to check form table coverage

> Always delete and reinstall in Violentmonkey when testing changes — VM caches compiled scripts aggressively.

---

## Inviolable Rules (mirror of Fujin contract)

- `border-radius` is `0` everywhere. Always. Add `!important` in injected CSS.
- All color from `FUJIN.*`. Never add a raw hex literal to this file.
- ES5 only. No `const`, no `let`, no arrow functions, no template literals, no destructuring.
- Do not modify `RAW/` files — they are read-only reference snapshots from the live router.
- Do not add external dependencies.
