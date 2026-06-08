# Changelog

All notable changes to Merlin's Cloak are documented here.

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
