# Changelog

All notable changes to Merlin's Cloak are documented here.

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
