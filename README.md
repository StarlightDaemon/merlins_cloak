# Merlin's Cloak

A Violentmonkey userscript that re-themes and reorganizes the AsusWRT-Merlin router web UI — no firmware modification, no SSH, no JFFS scripts required. Everything runs client-side in your browser.

**Target hardware:** Asus RT-BE92U  
**Firmware:** AsusWRT-Merlin `3006.102.7_2` and compatible  
**Status:** Active development — full dark theme in progress

---

## What It Does

### Menu Overhaul
The stock Merlin sidebar is a flat list of 15+ items with no grouping. This script rebuilds it into three labeled sections and hides items you rarely need:

```
General
  Network Map
  Client List      <- custom page (see below)
  AiMesh
  Network
  Adaptive QoS
  Traffic Analyzer

Network Settings
  Wireless
  LAN
  WAN
  IPv6
  VPN
  Firewall

System Tools
  Administration
  System Info
  System Log
  Network Tools
```

Hidden by default (easily re-enabled): AiProtection, Parental Controls, USB Application, Amazon Alexa, Quick Internet Setup.

### Client List Grid
Replaces Merlin's modal-based client list with a custom card grid embedded directly in the page:
- Filter tabs: All / Wired / Wireless
- Real-time search by name, IP, MAC, or vendor
- Color-coded connection badges (blue = Wired, green = 2.4GHz, orange = 5GHz, purple = 6GHz)
- Sorted by IP address

### Router Info in System Status
Injects your Operation Mode and Firmware version into the System Status panel on the home page, so you can see it at a glance without digging into Administration.

### Logo Home Link
Clicking the ASUS logo in the top banner takes you back to the Network Map / home page.

### Header Cleanup
Hides the redundant "Operation Mode / Firmware" bar below the banner (that info is now in the Status panel) and the Merlin logo overlay.

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

## Customization

### Re-enabling hidden menu items
Open the script in Violentmonkey's editor and remove the entry for any item you want to restore from the `HIDE_IDS` object near the top:

```javascript
var HIDE_IDS = {
    'AiProtection_HomeProtection_menu': true,   // remove this line to show AiProtection
    'AiProtection_WebProtector_menu':   true,   // remove to show Parental Controls
    'APP_Installation_menu':            true,   // remove to show USB Application
    'Advanced_Smart_Home_Alexa_menu':   true,   // remove to show Amazon Alexa
    'QIS_wizard_menu':                  true    // remove to show Quick Internet Setup
};
```

### Changing the menu order
Edit the `LAYOUT` array. Each `{ type: 'MENU', id: '...' }` entry corresponds to one nav item by its exact DOM id. `{ type: 'SEPARATOR', label: 'Section Name' }` inserts a labeled divider.

---

## Compatibility

| Router | Firmware | Status |
|--------|----------|---------|
| RT-BE92U | Merlin 3006.102.7_2 | Tested, working |
| Other Merlin devices | Recent Merlin | Likely compatible — menu IDs are consistent across models |

The script targets standard Merlin UI DOM structure. Stock AsusWRT (non-Merlin) may work but is untested.

---

## Technical Notes

The Merlin UI is a table-based XHTML layout from circa 2015 running in Almost Standards Mode. The script is written in strict ES5 for compatibility with the embedded browser context Violentmonkey injects into. No ES6+ features (arrow functions, template literals, const/let, etc.) are used.

---

## Roadmap

- [ ] Full dark theme (deep dark with ASUS teal/blue accents)
- [ ] Complete re-theme of all major pages (Wireless, LAN, WAN, VPN, etc.)
- [ ] Client list: Refresh button, Offline devices tab
- [ ] Sidebar background fill below last menu item

---

## License

MIT License - see [LICENSE](LICENSE)
