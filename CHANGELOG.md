# Changelog

All notable changes to Merlin's Cloak are documented here.

## [4.2.1] - 2026-06-08
### Fixed
- Home page network map: the System Status panel was wrapping and dropping to the
  bottom of the page. Cause: the v4.2.0 `#NM_table_div { display:flex; flex-wrap:wrap }`
  un-floated the two halves to their natural widths, which exceeded the column and
  forced the second half (status panel) onto a new line.
- Replaced the flex approach with a scoped fix (only runs where `#NM_table_div`
  exists, i.e. the home page): make the content cell greedy (`width:100%`) so the
  column fills the widened table, keep the original `width:50%;float:left` halves
  so they sit side by side, and center each half's inner table for balance.
- Settings pages (Traffic Analyzer, etc.) confirmed unaffected -- they already
  reflow to fill the widened layout, and this fix is gated off the network map.
### Note
- Each page will be reviewed individually for widescreen edge cases; the home page
  network map was the first and most visible.

## [4.2.0] - 2026-06-08
### Fixed
- Widescreen layout now visibly applies. Confirmed via live in-page diagnostic:
  `table.content`, `.banner1`, `.statusBar`, `.minup_bg` all expand to 1468px on
  an 1835px viewport (80vw). The earlier "nothing changed" report was the home
  page network map -- a fixed-geometry graphic that cannot reflow -- sitting left
  in the now-wide column, not a failure of the width expansion itself.
- `patchWidescreenLayout()` now spreads the network map's two fixed halves
  (topology diagram + System Status panel) across the widened column via
  `#NM_table_div { display:flex; justify-content:space-evenly }` with the
  children un-floated to their natural widths -- removes the dark gap on the right
- Switched the CSS width from `clamp(998px,80vw,1600px)` to explicit
  `width:80vw / min-width:998px / max-width:1600px` (same result; avoids any
  parser that would drop a whole declaration on an unrecognized `clamp()`)
- `patchWidescreenLayout()` now walks every ancestor of `table.content` up to
  `body`, making wrapper divs full-width so the clamped table can center
### Removed
- Temporary `fjnWidescreenDiag()` overlay (served its debugging purpose)
### Known limitation
- The home page network map is fixed-geometry and cannot grow; widescreen mode
  spreads its halves to fill the width. Settings pages (forms) reflow naturally.
- Footer (`.bottom-image`, `.copyright`) stays at 998px and centers; harmless

## [4.1.0] - 2026-06-08
### Added
- `widescreenLayout` toggle (default on): expands the fixed 998px layout to
  `clamp(998px,80vw,1600px)` -- scales with viewport width up to a 1600px cap,
  giving ~40-60% more usable width on 1920px+ displays without going edge-to-edge
- `patchWidescreenLayout()`: removes the `align="center"` HTML attribute from
  `table.content` (cannot be overridden by CSS), then uses `setProperty(...,'important')`
  to enforce the clamped width on `.banner1`, `.statusBar`, and `table.content`; pins
  the sidebar column at 204px to prevent the collapse regression from v3.1.9
- Second `setTimeout(patchWidescreenLayout, 800)` retry catches any Asus JS that
  reasserts inline widths after the initial load event
- Settings panel `rowHTML()` helper: rows are now data-driven so adding future
  toggles requires only one `rowHTML()` call each
- Widescreen Layout toggle visible in both the settings panel and the GM menu
### Changed
- `buildSettingsPanel()` event loop replaces individual per-row listeners with a
  single `for` loop over `[data-fjn-key]` elements; behavior identical

## [4.0.0] - 2026-06-08
### Changed
- Theme-only rebase: stripped all layout customization code out of
  `asus-merlin-ui.user.js` to focus exclusively on the Fujin theme engine
- Removed: LAYOUT, buildMenu, waitForMenu, hideMenuItems, getHideIds,
  makeLogoLink, fixMenuMargin, patchFluidLayout, hideTitleDown,
  hideNetworkMapCards, injectRouterInfoIntoIframe, the entire client list grid
  (buildClientGrid, refreshClientGrid, buildClientListPage,
  injectClientListMenuItem), patchGoToPage, all SETTINGS_DEFAULTS keys except
  `theme`, PRESET_THEME_ONLY, applyPreset, SETTING_ROWS (full), and the full
  buildSettingsPanel/registerMenuCommands
- Settings panel is now minimal: single Fujin Theme on/off toggle
- `buildFujinCSS()` no longer contains the fluidLayout CSS block
- Statusframe iframe theming extracted into its own `watchStatusframe()` function
  (decoupled from the router-info injection that is now in the scratchpad)
### Added
- `customizations-scratchpad.js`: all removed code preserved in one reference
  file with section headers; nothing was deleted, only set aside for later

## [3.4.0] - 2026-06-08
### Changed
- Full optionality for release: every hidden default element now has its own
  independent toggle. Nothing is hidden permanently.
- Split the two bundled hide-toggles into five granular ones:
  - `hideTitleDown` -> `hideTitleDownBar` (titledown bar) + `hideMerlinLogo`
    (Merlin logo)
  - `hideNetworkMapCards` -> `hideViewListBtn` (View List button) + `hideUsbCard`
    (USB card) + `hideAimeshCount` (AiMesh node count)
- `hideTitleDown()` and `hideNetworkMapCards()` now self-gate each element on its
  own setting; init/load call them unconditionally
- Settings panel groups the hides under three sub-headers: Hide: Header /
  Hide: Home Page / Hide: Menu Items (menu-item hide labels simplified)
- `PRESET_THEME_ONLY` updated to flip all five new keys off
### Migration
- The old `hideTitleDown` / `hideNetworkMapCards` storage keys are now unused
  (harmless if left in GM storage). The five replacements default to `true`, so
  out-of-box hiding behavior is unchanged. Anyone who had toggled a bundle OFF
  should re-toggle the matching granular items.

## [3.3.0] - 2026-06-08
### Added
- Clean theme/layout separation so the Fujin theme can be perfected against the
  stock Asus layout. Every layout customization is now individually toggleable.
- Two new toggles closing the last hardwired gaps:
  - `hideTitleDown` -- was always-on; hides the titledown bar + Merlin logo
  - `hideNetworkMapCards` -- was always-on; hides View List button, USB card,
    AiMesh node count on the home page
- One-click presets in the settings panel:
  - **Theme only (stock layout)** -- `applyPreset(PRESET_THEME_ONLY)`: theme on,
    every layout customization off (fluidLayout, menuReorder, clientList,
    routerInfo, logoLink, hideTitleDown, hideNetworkMapCards, and all 5 menu
    hides) -- a clean canvas for theme work
  - **Full customization** -- `applyPreset(SETTINGS_DEFAULTS)`: restores all
    features on
### Changed
- `hideTitleDown()` gated on `hideTitleDown` setting (init + load)
- `hideNetworkMapCards()` gated on `hideNetworkMapCards` setting (load + both
  setTimeout retries)
- `patchGoToPage()` gated on `clientList` (it is client-grid plumbing; safely
  no-ops without the grid, now formally tied to it)
- All 13 feature toggles default to `true` -- first-install behavior unchanged

## [3.2.0] - 2026-06-08
### Changed
- Fluid layout reworked to "full stretch + centered diagram" after confirming the
  home page network map is a fixed-geometry graphic (hardcoded cell heights,
  `bgcolor` cells, pixel-positioned connector lines) that cannot reflow:
  - Outer chrome (banner, status bar, `table.content`, content column) now
    stretches edge-to-edge to the viewport
  - `#NM_table_div` is a centered flex group (`justify-content:center`) so the two
    fixed-geometry halves (topology diagram + status panel) sit centered with
    symmetric whitespace instead of piling left with empty space on the right
  - Network map halves no longer forced to grow (`flex:0 0 auto`, `width:auto`,
    `float:none`); status frame kept at its natural 320px design width
  - Settings pages (`.FormTable`, `.FormTitle`) fill the full content width
    (removed the prior 900px ultrawide cap)
### Fixed
- Sidebar menu no longer collapses to zero width: the menu lives in an unclassed
  `<td width="204">`; under `table-layout:fixed` the v3.1.9 attribute removal +
  forcing the content column to `width:100%` squeezed it to nothing.
  `patchFluidLayout()` now explicitly sets the three layout columns
  (spacer `0`, menu `200px`, content `auto`) via `setProperty('width',...,'important')`
- Removed dead CSS rule `td#mainMenu { width:192px }` -- `#mainMenu` is a child
  `<div>`, not the `<td>`, so the selector matched nothing and never set the
  sidebar width

## [3.1.9] - 2026-06-08
### Fixed
- `patchFluidLayout()` now removes HTML `align="center"` and per-column `width`
  attributes from `table.content` (CSS and `setProperty` cannot override HTML
  attributes); clears `float:left` on the anonymous `#NM_table_div` children
### Note
- Intermediate step toward 3.2.0 -- this version introduced the sidebar-collapse
  regression that 3.2.0 fixes

## [3.1.8] - 2026-06-08
### Added
- `patchFluidLayout()`: JS-based fluid layout enforcement that uses
  `element.style.setProperty(prop, val, 'important')` to win over Asus JS-set
  inline widths (which CSS `!important` cannot beat); walks every ancestor of
  `table.content` up to `body` expanding unknown wrapper divs that were
  constraining the layout to ~998px; also expands `.banner1`, `.statusBar`,
  `.minup_bg`, `td.bgarrow`, `#NM_table_div` children, and `#statusframe` via
  the same priority-forcing path
- Called at load + `setTimeout(patchFluidLayout, 500)` + `setTimeout(patchFluidLayout, 1500)`
  to catch late Asus JS initialization; gated on `fluidLayout` setting

### Fixed
- Fluid layout was still condensed to ~998px despite CSS `!important` rules:
  root cause was Asus JavaScript setting `element.style.width = '998px'` as a
  regular inline style, which has higher specificity than any CSS `!important`
  rule; JS `setProperty` with `'important'` flag is the only way to override it

## [3.1.7] - 2026-06-08
### Fixed
- System Status panel and statusframe iframe now correctly theme with Fujin
  colors: switched from `var(--fjn-*)` CSS custom properties to direct hex
  values via `FUJIN.*` string concatenation in `buildFujinCSS()` -- CSS custom
  properties do not resolve across iframe boundaries, so `var(--fjn-bg-status)`
  was silently falling back to transparent/unset inside `#statusframe`
- Replaced transparent status panel backgrounds (from v3.1.3 clearing pass)
  with full Fujin surface coverage: `.main-block`, `.unit-block`,
  `.division-block`, `.info-block`, `.tab-block`, `.statusTitle`,
  `.bar-container`, `.core-color-container`, `.tab-click`/`.tab-block:hover`
### Changed
- Fluid layout CSS block revised to target all structural elements with
  `box-sizing:border-box` and zero margins on `.banner1`/`.statusBar`

## [3.1.6] - 2026-06-08
### Fixed
- Settings button (`[=]`) no longer hidden under Asus navigation controls when Fujin
  theme is toggled off: changed from `float:right` inside `.banner1` to
  `position:fixed;top:8px;right:8px;z-index:99998` on `document.body` -- now visible
  regardless of theme state or banner stacking context

## [3.1.5] - 2026-06-08
### Added
- Click-outside-to-close for settings panel: clicking anywhere outside the panel (and
  outside the `[=]` toggle button) now hides it automatically
- `attachPanelOutsideClick(panel)`: attaches a document-level `click` listener scoped
  to the panel; `setTimeout(0)` deferral prevents the opening click from firing the
  handler immediately
- `_panelOutsideHandler`: stored reference to the active outside-click handler; old
  handler is removed before a new one is attached so repeated open/close cycles do not
  accumulate listeners

## [3.1.4] - 2026-06-08
### Added
- Settings infrastructure: `SETTINGS_DEFAULTS`, `loadSetting(key)`, `saveSetting(key,val)`,
  `getHideIds()` -- storage backed by `GM_getValue`/`GM_setValue` when available,
  `localStorage` (key prefix `fjn_`) as fallback; works in VM, TM, Safari Userscripts
- In-page settings panel (`buildSettingsPanel()`): fixed overlay at top-right, opened
  by a `[=]` button injected into the banner bar; lists all feature toggles with
  `[ON]`/`[OFF]` labels; includes Reset to defaults row; all colors via `FUJIN.*`
- GM extension menu (`registerMenuCommands()`): registers the same toggles in the
  userscript manager popup if `GM_registerMenuCommand` is available; silently skipped
  otherwise -- safe for all managers
- New header grants: `GM_getValue`, `GM_setValue`, `GM_registerMenuCommand`
  (replacing `@grant none`)
### Changed
- Each feature now gated on its setting at init: theme, fluidLayout, menuReorder,
  clientList, routerInfo, logoLink -- all default true so behavior unchanged on first
  install
- `hideMenuItems()` now reads `getHideIds()` at call time instead of static `HIDE_IDS`
- `waitForMenu()` gates `injectClientListMenuItem` on `clientList` setting and
  `buildMenu` on `menuReorder` setting; falls back to `hideMenuItems()` if reorder off
- `buildFujinCSS()` conditionally appends fluid layout rules based on `fluidLayout`
  setting

## [3.1.3] - 2026-06-08
### Added
- Fluid/responsive layout: `table.content` now fills 100% of viewport width instead
  of auto-sizing to ~1000px and centering; `td.bgarrow` expands into remaining space
- Banner bar (`banner1`) and status-bar row (`.statusBar`) set to `width:100%`
  overriding the hardcoded inline `style="width:998px; margin:0 auto;"`
- Network Map area (`#NM_table_div`) uses flexbox so the diagram and System Status
  panel each take 50% of available width and expand on wider screens
- `#statusframe` fills its flex column (`width:100%`)
- `@media (min-width:1400px)` cap: form tables (`.FormTable`, `.FormTitle`) max
  out at 860px so settings pages stay readable on ultrawide displays
- Removed 998px inline width centering constraint from `.statusBar`
### Fixed
- System Status panel backgrounds stripped to `transparent` pending full redo

## [3.1.2] - 2026-06-08
### Fixed
- Language dropdown in banner: `.navigation li dt` uses the same PNG background as
  `.titledropdownbtn` but via a different selector -- added dedicated overrides for
  the `dt`, `dt:hover`, `dd`, and `dd:hover` states
- Status bar row (`.statusBar`, `.minup_bg`): was rendering `midup_bg.png` tile;
  now overridden with `bgDark` solid color
- Main content table (`table.content`, `.mindown_bg`): was rendering `middown_bg.png`
  tile; now overridden with `bgPage` solid color
- `.division-block`: added `border-left-color:accentBright` to replace the raw
  `#007eff` value from `networkMap.css`
- Status panel border-radius: zeroed `.bar-container` (6px), `.core-color-container`
  (4px), and `.tab-block` (5px 5px 0 0)
- `.statusTitle` gradient and 10px radius removed (fallback for older firmware pages)
- `.tab-click` and `.tab-block:hover` explicitly set to `contentBg`
  (source: `RAW/new/` live page capture)

## [3.1.1] - 2026-06-08
### Fixed
- Top banner bar: added `.banner1` background override (strips PNG image), `.titlebtn`
  flat color + `border-radius:0`, `.titledropdownbtn` PNG background replaced with
  `bgDark`, hover states use `accentBtn`
- Right System Status panel: added `.unit-block`, `.division-block`, `.info-block`,
  `.info-title`, `.info-content` to `buildFujinCSS()` so statusframe unit blocks
  pick up Fujin colors (these selectors are injected into the iframe via the existing
  `injectFujinStyle` call on iframe load)

## [3.1.0] - 2026-06-08
### Added
- Offline tab in client grid -- fourth filter tab showing clients where `isOnline` is
  falsy; cards rendered at 0.5 opacity with no connection-type badge and IP/MAC/vendor
  all in `FUJIN.textMuted`
- Refresh button in client grid header -- placed to the right of the search input;
  calls `window.refreshClientGrid()` on click; styled to match the tab buttons

## [3.0.0] - 2026-06-08
### Added
- `FUJIN` token map -- 30 named constants sourced from `RAW/*.css` covering all
  background layers, surfaces, borders, text roles, accents, connection badge colors,
  and typography (font families from Fujin `tokens.json`)
- `buildFujinCSS()` -- builds a full stylesheet overriding all key Merlin CSS selectors;
  defines `--fjn-*` CSS custom properties on `:root`
- `injectFujinStyle(doc)` -- injects `<style id="fujin-theme">` into any document;
  idempotent; called on main document at init and on `statusframe.contentDocument`
  on iframe load
- Global `border-radius:0 !important` enforcement across all Merlin rounded-corner
  elements (Fujin `tokens.radius.default = 0`)
### Changed
- `buildClientGrid()`: all hardcoded hex values replaced with `FUJIN.*` references;
  all `border-radius` values removed from inline styles
- Version bump: 2.1.4 -> 3.0.0 (major: theme injection is a new capability layer)
- `CLAUDE.md` added as session anchor for future agent work

## [2.1.4] - 2026-06-07
### Fixed
- `hideNetworkMapCards`: switched to `querySelectorAll` for AiMesh node hiding so all
  matching elements are hidden, not just the first one
- `refreshClientGrid`: added `.length` check on `originData.fromNetworkmapd` before
  iterating to prevent silent failure on unexpected data shapes
- `injectRouterInfoIntoIframe`: added 20-retry cap on `tryInject` polling loop to
  prevent an infinite setTimeout chain if the iframe never fully loads

## [2.1.3] - 2026-06-06
### Changed
- Full ES5 rewrite complete; RTF encoding artifact resolved, file stored as plain text

## [2.1.x] - 2026-06 (prior)
### Added
- Custom client list card grid with filter tabs, search, and IP-sorted layout
- ES5 scope fixes and color polish across card grid

## [2.0.x]
### Added
- Client List menu item injection
- Network map card hiding (View List button, USB card, AiMesh count)

## [1.9.x]
### Fixed
- First-child margin approach for menu overlap; padding experiments resolved

## [1.8.x]
### Changed
- Full ES5 rewrite; margin and stacking fixes iterated

## [1.7.0]
### Added
- Router Info block injected into statusframe iframe
- QIS menu item removed; titledown bar hidden

## [1.6.x]
### Fixed
- Menu margin, z-index, Merlin logo hide

## [1.5.0]
### Added
- Logo home link (wraps ASUS title image in anchor to index.asp)

## [1.4.0]
### Changed
- Hidden items kept in LAYOUT at logical positions for easier restoration

## [1.3.0]
### Added
- Menu reorder and three-section grouping (General / Network Settings / System Tools)

## [1.2.0]
### Fixed
- Corrected to use exact div IDs from live DOM inspection

## [1.1.0]
### Changed
- Switched from CSS href selectors to MutationObserver targeting div IDs

## [1.0.0]
### Added
- Initial release; CSS href selector approach (non-functional due to no anchor tags in menu)
