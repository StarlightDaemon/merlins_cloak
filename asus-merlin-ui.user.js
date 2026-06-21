// ==UserScript==
// @name         Asus RT-BE92U - Merlin's Cloak
// @namespace    https://github.com/StarlightDaemon/merlins_cloak
// @version      4.6.0
// @description  Fujin theme for AsusWRT-Merlin router admin UI
// @author       StarlightDaemon
// @downloadURL  https://raw.githubusercontent.com/StarlightDaemon/merlins_cloak/main/asus-merlin-ui.user.js
// @updateURL    https://raw.githubusercontent.com/StarlightDaemon/merlins_cloak/main/asus-merlin-ui.user.js
// @match        http://192.168.1.1/*
// @match        https://192.168.1.1/*
// @match        http://router.asus.com/*
// @match        https://router.asus.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

/*
 * v4.5.2 -- Card-style topology strip: gaps, top-aligned icons, distinct cards.
 *
 * Why: the router JS only ever writes PLAIN inline styles (verified against
 * firmware source tag 3006.102.7_2). Author stylesheet rules with !important
 * beat plain inline styles, always. JS setProperty(...,'important') patches,
 * by contrast, are destroyed by any later plain style write (CSSOM drops the
 * priority flag) -- which is why v4.x needed staggered retry timers.
 *
 * Architecture:
 *  - Three independent stylesheets: #fujin-theme (colors/fonts/radius),
 *    #fujin-layout (widescreen + topology strip + status grid), and
 *    #fujin-hides (optional element hides). Each is self-contained (own
 *    :root vars where needed) so every toggle works alone.
 *  - JS only does what CSS cannot: removes a few HTML attributes, tags
 *    layout roles with fjn-* classes (one shot, idempotent -- router JS
 *    never rewrites class attributes on these elements), and measures the
 *    statusframe content height.
 *  - Dynamic sizing rides a CSS custom property: the stylesheet pins
 *    #statusframe { height:var(--fjn-sf-h) !important } and a height
 *    reporter inside the iframe document feeds --fjn-sf-h on the top
 *    document. The reporter is attached twice for redundancy -- by the
 *    script instance running inside the frame (no @noframes -- deliberate)
 *    and by the top instance on every iframe load -- with a per-document
 *    marker so only one attaches. The router's set_NM_height()/
 *    reset_NM_height() inline writes are inert against the stylesheet pin.
 */

(function () {
    'use strict';

    // =========================================================
    //  SETTINGS
    // =========================================================

    var SETTINGS_DEFAULTS = {
        theme:            true,
        widescreenLayout: true,
        hideViewListBtn:  true
    };

    var SETTING_LABELS = {
        theme:            'Fujin Theme',
        widescreenLayout: 'Widescreen Layout',
        hideViewListBtn:  'Hide View List Button'
    };

    var SETTING_ORDER = ['theme', 'widescreenLayout', 'hideViewListBtn'];

    function loadSetting(key) {
        var def = SETTINGS_DEFAULTS[key];
        if (typeof GM_getValue === 'function') { return GM_getValue(key, def); }
        try {
            var s = localStorage.getItem('fjn_' + key);
            return s !== null ? JSON.parse(s) : def;
        } catch (e) { return def; }
    }

    function saveSetting(key, val) {
        if (typeof GM_setValue === 'function') { GM_setValue(key, val); return; }
        try { localStorage.setItem('fjn_' + key, JSON.stringify(val)); } catch (e) {}
    }

    // =========================================================
    //  FUJIN TOKEN MAP
    //  Color values sourced directly from Merlin RAW CSS files.
    //  Typography from Fujin tokens.json.
    //  All border-radius values are 0 (tokens.radius.default).
    // =========================================================

    var FUJIN = {
        // Page-level backgrounds (dark -> light)
        bgPage:    '#21333e',  // body  (index_style.css)
        bgDark:    '#1f2d35',  // FormTable th, top-input (form_style.css)
        bgStatus:  '#2a3539',  // statusbody, NM containers (NM_style.css)
        bgOverlay: '#2b373b',  // pop_div_bg, floating panels (form_style.css)
        bgTitle:   '#2f3a3e',  // .tab default, .tm_title_bg (form_style.css)
        // Surfaces
        navBg:     '#3a4042',  // .menu, .control_bg (index_style.css / form_style.css)
        blockBg:   '#444f53',  // .block_bg, port status panels (form_style.css)
        contentBg: '#4d595d',  // .tabClicked, .content_bg, FormTitle thead
        cellBg:    '#475a5f',  // .FormTable td, .textarea_bg
        inputBg:   '#596e74',  // .input_*_table, clientIcon bg (form_style.css / device-map.css)
        // Borders
        borderDark:  '#222',      // FormTable td inner borders
        borderMenu:  '#6b7071',   // .menu border, .menu_Split border (index_style.css)
        borderInput: '#929ea1',   // .input_*_table border (form_style.css)
        borderCard:  '#3a4042',   // card separation (= navBg; reserved, unused today)
        // Text
        textPrimary:   '#ffffff',
        textSecondary: '#93a9b1',  // .tab_font_color (form_style.css)
        textMuted:     '#667881',  // lightest muted, vendor labels
        textLink:      '#569ac7',  // .clients span, .style1, .NMitem a (NM_style.css)
        textHint:      '#ffcc00',  // .hint-color, FormTable td span (form_style.css)
        // Accents
        accentHover:  '#77a5c6',  // .menu:hover (index_style.css)
        accentBtn:    '#09639c',  // .button_gen:hover gradient start (form_style.css)
        accentBright: '#248dff',  // scrollbar thumb (form_style.css)
        // Connection type badges (reserved for the future client grid;
        // only ghz24 is referenced today, as the settings [ON] color)
        wired: '#4a9eff',
        ghz24: '#44cc88',
        ghz5:  '#ffaa33',
        ghz6:  '#cc44ff',
        // Effects
        shadowColor: 'rgba(0,0,0,0.5)',
        // Typography -- exact values from tokens.json (fontMono reserved
        // for future log/textarea styling)
        fontBase: '"Verdana", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontMono: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Consolas, monospace'
    };

    // Shared :root custom-property block. Included in BOTH stylesheets so
    // each toggle is fully self-contained (theme-off + widescreen-on works).
    function rootVarsCSS() {
        return [
            ':root {',
            '  --fjn-bg-page:'    + FUJIN.bgPage    + ';',
            '  --fjn-bg-dark:'    + FUJIN.bgDark    + ';',
            '  --fjn-bg-status:'  + FUJIN.bgStatus  + ';',
            '  --fjn-bg-overlay:' + FUJIN.bgOverlay + ';',
            '  --fjn-bg-title:'   + FUJIN.bgTitle   + ';',
            '  --fjn-nav-bg:'     + FUJIN.navBg     + ';',
            '  --fjn-block-bg:'   + FUJIN.blockBg   + ';',
            '  --fjn-content-bg:' + FUJIN.contentBg + ';',
            '  --fjn-cell-bg:'    + FUJIN.cellBg    + ';',
            '  --fjn-input-bg:'   + FUJIN.inputBg   + ';',
            '  --fjn-border-dark:'  + FUJIN.borderDark  + ';',
            '  --fjn-border-menu:'  + FUJIN.borderMenu  + ';',
            '  --fjn-border-input:' + FUJIN.borderInput + ';',
            '  --fjn-text:'         + FUJIN.textPrimary   + ';',
            '  --fjn-text-2:'       + FUJIN.textSecondary + ';',
            '  --fjn-text-link:'    + FUJIN.textLink      + ';',
            '  --fjn-text-hint:'    + FUJIN.textHint      + ';',
            '  --fjn-accent-hover:' + FUJIN.accentHover  + ';',
            '  --fjn-accent-btn:'   + FUJIN.accentBtn    + ';',
            '  --fjn-accent-bright:'+ FUJIN.accentBright + ';',
            '}'
        ].join('\n');
    }

    // Stylesheets are immutable per page life (every settings change does
    // location.reload), so build each variant once and reuse.
    var _cssCache = {};

    // =========================================================
    //  THEME STYLESHEET (#fujin-theme)
    //  Pure restyling of stock selectors. No layout, no hiding.
    // =========================================================

    function buildThemeCSS() {
        if (_cssCache.theme) { return _cssCache.theme; }
        var _p = [
            rootVarsCSS(),

            /* Scrollbars */
            'html::-webkit-scrollbar-thumb { background-color:var(--fjn-accent-bright) !important; }',
            'html::-webkit-scrollbar-track { background-color:var(--fjn-bg-dark) !important; }',

            /* Page */
            'html { background-color:var(--fjn-bg-page) !important; }',
            'body { background-color:var(--fjn-bg-page) !important; color:var(--fjn-text) !important; }',

            /* Navigation sidebar */
            '.menu, .menu_blocked {',
            '  background-color:var(--fjn-nav-bg) !important;',
            '  border:1px solid var(--fjn-border-menu) !important;',
            '  border-radius:0 !important;',
            '}',
            '.menu:hover, .menu:active {',
            '  background-color:var(--fjn-accent-hover) !important;',
            '  border-radius:0 !important;',
            '}',
            '.menu a:link, .menu a:visited, .submenu a:link, .submenu a:visited { color:var(--fjn-text) !important; }',
            '.menuClicked, .menu_clicked {',
            '  background:var(--fjn-text-link) !important;',
            '  border:1px solid var(--fjn-text-link) !important;',
            '  border-radius:0 !important;',
            '}',
            '.menu_Split {',
            '  background-color:var(--fjn-block-bg) !important;',
            '  border:1px solid var(--fjn-border-menu) !important;',
            '  color:var(--fjn-text-2) !important;',
            '  border-radius:0 !important;',
            '}',
            '/* Sidebar container */',
            'td.bgarrow { background-color:var(--fjn-nav-bg) !important; }',
            '#mainMenu { background-color:var(--fjn-nav-bg) !important; }',

            /* Tabs */
            '.tab { background:var(--fjn-bg-title) !important; color:var(--fjn-text) !important; border-radius:0 !important; }',
            '.tab:hover, .tabClicked { background:var(--fjn-content-bg) !important; border-radius:0 !important; }',
            '.tab_NW, .tab_NW span { background:var(--fjn-bg-title) !important; color:var(--fjn-text) !important; border-radius:0 !important; }',
            '.tab_NW:hover, .tab_NW:hover span, .tabclick_NW, .tabclick_NW span {',
            '  background:var(--fjn-block-bg) !important; border-radius:0 !important;',
            '}',
            '.tab_item { background-color:var(--fjn-bg-title) !important; border-radius:0 !important; }',
            '.tab_item:hover, .tab_item_click { background-color:var(--fjn-block-bg) !important; border-radius:0 !important; }',

            /* Form tables */
            '.FormTitle { border:1px solid var(--fjn-content-bg) !important; border-radius:0 !important; }',
            '.FormTitle thead { background-color:var(--fjn-content-bg) !important; }',
            '.FormTable th, .FormTable_table th, .FormTable_NWM th {',
            '  background:var(--fjn-bg-dark) !important;',
            '  color:var(--fjn-text) !important;',
            '  border:1px solid var(--fjn-border-dark) !important;',
            '}',
            '.FormTable thead td, .FormTable_table thead td, .FormTable_NWM thead td,',
            '.FormTable thead th, .FormTable_table thead th, .FormTable_NWM thead th {',
            '  background:var(--fjn-content-bg) !important;',
            '  color:var(--fjn-text) !important;',
            '  border:1px solid var(--fjn-border-dark) !important;',
            '}',
            '.FormTable td, .FormTable_table td, .FormTable_NWM td {',
            '  background-color:var(--fjn-cell-bg) !important;',
            '  border:1px solid var(--fjn-border-dark) !important;',
            '}',
            '.FormTable td span, .FormTable_table td span, .FormTable_NWM td span { color:var(--fjn-text-hint) !important; }',

            /* Input fields */
            '.input_32_table,.input_30_table,.input_25_table,.input_22_table,',
            '.input_20_table,.input_18_table,.input_15_table,.input_12_table,',
            '.input_6_table,.input_3_table,.input_macaddr_table {',
            '  background:var(--fjn-input-bg) !important;',
            '  border:1px solid var(--fjn-border-input) !important;',
            '  color:var(--fjn-text) !important;',
            '  border-radius:0 !important;',
            '}',
            '.input_option, .input_option_left {',
            '  background-color:var(--fjn-input-bg) !important;',
            '  color:var(--fjn-text) !important;',
            '  border-radius:0 !important;',
            '}',
            '.input_option optgroup { background-color:var(--fjn-input-bg) !important; }',
            '.IPaddr { background-color:var(--fjn-content-bg) !important; border-radius:0 !important; }',
            '.IPaddr input { background-color:var(--fjn-content-bg) !important; color:var(--fjn-text) !important; border-radius:0 !important; }',
            '.devicepin { background-color:var(--fjn-cell-bg) !important; color:var(--fjn-text) !important; }',
            '.inputinfo { background-color:var(--fjn-input-bg) !important; }',

            '/* Disabled and read-only input states */',
            'input:disabled, input[readonly] {',
            '  background-color:var(--fjn-cell-bg) !important;',
            '  color:var(--fjn-text) !important;',
            '  border:1px solid var(--fjn-border-dark) !important;',
            '}',
            '.input {',
            '  background-color:var(--fjn-input-bg) !important;',
            '  color:var(--fjn-text) !important;',
            '}',

            /* Buttons */
            '.button_gen, .button_gen_dis {',
            '  background:var(--fjn-bg-title) !important;',
            '  color:var(--fjn-text) !important;',
            '  border-radius:0 !important;',
            '}',
            '.button_gen:hover, .button_gen_touch {',
            '  background:var(--fjn-accent-btn) !important;',
            '  color:var(--fjn-text) !important;',
            '  border-radius:0 !important;',
            '}',
            '#cancelBtn, #applyBtn { background:var(--fjn-bg-title) !important; color:var(--fjn-text) !important; border-radius:0 !important; }',
            '#cancelBtn:hover, #applyBtn:hover { background:var(--fjn-accent-btn) !important; }',

            /* Top banner bar */
            '.banner1 { background:var(--fjn-bg-dark) !important; }',
            '.titlebtn {',
            '  background:var(--fjn-bg-dark) !important;',
            '  border-radius:0 !important;',
            '  border:1px solid var(--fjn-border-menu) !important;',
            '}',
            '.titlebtn:hover { background:var(--fjn-accent-btn) !important; }',
            '.titledropdownbtn {',
            '  background-image:none !important;',
            '  background-color:var(--fjn-bg-dark) !important;',
            '  border-radius:0 !important;',
            '}',
            '.titledropdownbtn:hover {',
            '  background-image:none !important;',
            '  background-color:var(--fjn-accent-btn) !important;',
            '}',
            /* Language dropdown (uses same PNG as titledropdownbtn) */
            '.navigation li dt { background-image:none !important; background-color:var(--fjn-bg-dark) !important; }',
            '.navigation li dt:hover { background-image:none !important; background-color:var(--fjn-accent-btn) !important; }',
            '.navigation li dd { background-color:var(--fjn-bg-dark) !important; border-bottom:1px solid var(--fjn-border-menu) !important; }',
            '.navigation li dd:hover { background-color:var(--fjn-accent-btn) !important; }',
            /* Status bar row and main content area (removes PNG tile backgrounds) */
            '.statusBar, .minup_bg { background-image:none !important; background-color:var(--fjn-bg-dark) !important; }',
            'table.content, .mindown_bg { background-image:none !important; background-color:var(--fjn-bg-page) !important; }',
            '/* Footer utility bar (Help & Support / FAQ search). Stock',
            '   bottom_bg.png renders a black bar that clashes with the theme. */',
            '.bottom-image {',
            '  background-image:none !important;',
            '  background-color:var(--fjn-bg-dark) !important;',
            '  border-radius:0 !important;',
            '}',
            '.input_FAQ_table {',
            '  background-color:var(--fjn-input-bg) !important;',
            '  color:var(--fjn-text) !important;',
            '  border:1px solid var(--fjn-border-input) !important;',
            '  border-radius:0 !important;',
            '}',

            /* Semantic bg helpers */
            '.content_bg, .list_bg, .MainContent { background:var(--fjn-content-bg) !important; }',
            '.block_bg { background:var(--fjn-block-bg) !important; }',
            '.control_bg { background:var(--fjn-nav-bg) !important; }',
            '.pop_div_bg, .clientlist_content, .clientlist_viewlist { background-color:var(--fjn-bg-overlay) !important; }',
            '.analysis_bg, .tm_title_bg { background:var(--fjn-bg-title) !important; }',
            '.textarea_bg, .textarea_log_table { background:var(--fjn-cell-bg) !important; color:var(--fjn-text) !important; }',
            '.tab_info_bg { background:var(--fjn-block-bg) !important; }',
            '.apply_gen { background-color:var(--fjn-content-bg) !important; }',
            '.list_table { background-color:var(--fjn-cell-bg) !important; }',
            '.list_table td { color:var(--fjn-text) !important; }',
            '.eula_panel_container { background-color:var(--fjn-bg-overlay) !important; border-color:var(--fjn-content-bg) !important; border-radius:0 !important; }',

            /* VPN title tabs */
            '.vpnClientTitle_td_click { background-color:var(--fjn-content-bg) !important; }',
            '.vpnClientTitle_td_unclick { background-color:var(--fjn-bg-status) !important; }',

            /* Text / links -- the generic anchor rule must come FIRST: it has
               the same specificity (0,1,1) as .NMitem a, so source order is
               what lets the link-blue rule below win. */
            'a:link, a:visited { color:var(--fjn-text) !important; }',
            '.tab_font_color { color:var(--fjn-text-2) !important; }',
            '.hint-color, .hintColor { color:var(--fjn-text-hint) !important; }',
            '.clients span, .style1, .NMitem a { color:var(--fjn-text-link) !important; }',

            /* Breadcrumb nav */
            '.nav li { background:var(--fjn-content-bg) !important; }',
            '.nav li a { color:var(--fjn-text) !important; }',
            '.nav li:hover { background-color:var(--fjn-accent-hover) !important; }',

            /* Network Map / statusframe */
            '.statusbody { background-color:var(--fjn-bg-status) !important; border-radius:0 !important; }',
            '.NM_radius_bottom_container { background-color:var(--fjn-bg-status) !important; border-radius:0 !important; }',
            '.NM_table { background-color:var(--fjn-bg-page) !important; border-radius:0 !important; }',
            'table.table1px, .table1px th { background-color:var(--fjn-content-bg) !important; border-color:var(--fjn-content-bg) !important; }',

            /* Status panel (statusframe document). The sheet is injected into
               the iframe document too, with its own :root block, so vars are
               safe to use here. */
            '.main-block { background:var(--fjn-bg-status) !important; }',
            '.unit-block { background:var(--fjn-bg-status) !important; border-radius:0 !important; box-shadow:none !important; color:var(--fjn-text) !important; }',
            '.division-block { background:var(--fjn-bg-dark) !important; color:var(--fjn-text) !important; border-radius:0 !important; box-shadow:none !important; }',
            '.info-block { background:transparent !important; border-bottom:1px solid var(--fjn-border-dark) !important; }',
            '.info-title { color:var(--fjn-text-2) !important; }',
            '.info-content { color:var(--fjn-text) !important; }',
            '.statusTitle { background:var(--fjn-bg-dark) !important; color:var(--fjn-text) !important; border-radius:0 !important; box-shadow:none !important; }',
            '.bar-container { background:var(--fjn-bg-dark) !important; border-radius:0 !important; }',
            '.core-color-container { border-radius:0 !important; }',
            '.tab-block { background:var(--fjn-bg-status) !important; border-radius:0 !important; }',
            '.tab-click, .tab-block:hover { background:var(--fjn-content-bg) !important; }',

            /* Client / device icons */
            '.clientIcon, .clientIcon_no_hover, .imgUserIcon_card, .imgUserIcon_viewlist {',
            '  background-color:var(--fjn-input-bg) !important; border-radius:0 !important;',
            '}',
            '.clientIcon:hover, .imgUserIcon_card:hover { background-color:var(--fjn-accent-hover) !important; border-radius:0 !important; }',

            /* Sortable row hover */
            '#sortable div table tr:hover { background-color:var(--fjn-cell-bg) !important; }',

            /* Global border-radius zero */
            '.cloud_main_radius,.cloud_main_radius_left,.cloud_main_radius_right,',
            '.NM_radius,.NM_radius_left,.NM_radius_right,.NM_radius_top,.NM_radius_bottom,',
            '.pop_div_container,.qrcodepanel,.qrcodepanelpad,',
            '.s46_ports,.s46_ports_pf,.noti_s46_ports,',
            '#overDiv_table1,#overDiv_table2,#overDiv_table3,#overDiv_table4,#overDiv_table5 {',
            '  border-radius:0 !important;',
            '  -webkit-border-radius:0 !important;',
            '}',

            /* Topology connector bars -- keep the stock (vertical) layout bars
               visible on our dark bg in case the strip degrades to stock layout. */
            '.single_wan_connected, .primary_wan_connected, .secondary_wan_connected {',
            '  background:var(--fjn-border-menu) !important;',
            '}',

            '/* AiMesh toggle switches */',
            '.switch.off { background-color:var(--fjn-nav-bg) !important; }',
            '.switch.on  { background-color:var(--fjn-accent-bright) !important; }',
            '/* AiMesh location select */',
            '#sel_location {',
            '  background-color:var(--fjn-input-bg) !important;',
            '  color:var(--fjn-text) !important;',
            '  border:1px solid var(--fjn-border-input) !important;',
            '  border-radius:0 !important;',
            '}',
            '/* QoS bandwidth bar fills */',
            '[id$="_upload_bar"]   { background-color:var(--fjn-accent-btn) !important; }',
            '[id$="_download_bar"] { background-color:var(--fjn-accent-bright) !important; }',

            '/* jQuery UI sliders (Wireless Professional, etc.) -- light blue range',
            '   fill and light gray handle on the stock widget */',
            '.ui-slider {',
            '  background-color:var(--fjn-cell-bg) !important;',
            '  border:1px solid var(--fjn-border-input) !important;',
            '  border-radius:0 !important;',
            '}',
            '.ui-slider .ui-slider-range, .ui-slider-range {',
            '  background:var(--fjn-accent-bright) !important;',
            '  border-radius:0 !important;',
            '}',
            '.ui-slider .ui-slider-handle, .ui-slider-handle {',
            '  background:var(--fjn-input-bg) !important;',
            '  border:1px solid var(--fjn-border-input) !important;',
            '  border-radius:0 !important;',
            '}',

            '/* Network Map: USB label text, hover hint tooltip, client-list',
            '   cards and the default type/vendor icon squares (stock white) */',
            '.usb_text { color:var(--fjn-text) !important; }',
            '.navtext, #navtxt {',
            '  background-color:var(--fjn-bg-overlay) !important;',
            '  color:var(--fjn-text) !important;',
            '  border:1px solid var(--fjn-border-menu) !important;',
            '  border-radius:0 !important;',
            '}',
            '.clientBg {',
            '  background-image:none !important;',
            '  background-color:var(--fjn-block-bg) !important;',
            '  border-radius:0 !important;',
            '}',
            'i[class^="type"], i.vendor-icon {',
            '  background-color:var(--fjn-input-bg) !important;',
            '  border-radius:0 !important;',
            '}',

            '/* Native range sliders (e.g. Smart Connect band-steering',
            '   thresholds) render with a white track/thumb on the stock UI */',
            'input[type="range"] {',
            '  accent-color:var(--fjn-accent-bright) !important;',
            '  background-color:transparent !important;',
            '  border-radius:0 !important;',
            '}',
            '/* Apply-settings loading word overlay (white stock box) */',
            '.drword, .drsword {',
            '  background-color:var(--fjn-bg-overlay) !important;',
            '  color:var(--fjn-text) !important;',
            '  border-radius:0 !important;',
            '}',

            '/* Firmware upgrade / settings-restore progress track (stock white) */',
            '.Bar_container {',
            '  background-color:var(--fjn-block-bg) !important;',
            '  border:1px solid var(--fjn-border-input) !important;',
            '  border-radius:0 !important;',
            '}',

            '/* Native UA controls: render checkboxes, radios, select drop-down',
            '   popups and scrollbars in dark mode (otherwise the unchecked',
            '   radio/checkbox and the open select popup stay stock white), and',
            '   brand the checked state with the accent. */',
            ':root { color-scheme:dark !important; }',
            'input[type="checkbox"], input[type="radio"] {',
            '  accent-color:var(--fjn-accent-bright) !important;',
            '}'
        ];
        _cssCache.theme = _p.join('\n');
        return _cssCache.theme;
    }

    // =========================================================
    //  LAYOUT STYLESHEET (#fujin-layout)
    //  Widescreen chrome + home-page dashboard + topology strip.
    //  Every rule is keyed to stable ids/classes (fjn-* classes are
    //  applied once by patchWidescreenAttrs / tagNetworkMapHome).
    //  Stylesheet !important outranks every plain inline write the
    //  router JS makes, so no re-application timers are needed.
    // =========================================================

    function buildLayoutCSS(isFrame) {
        var key = isFrame ? 'layoutFrame' : 'layoutTop';
        if (_cssCache[key]) { return _cssCache[key]; }
        var _p = [
            rootVarsCSS(),

            /* --- Widescreen chrome: 80vw clamped between 998 and 1600 --- */
            '.banner1, .statusBar, .minup_bg, table.content {',
            '  width:80vw !important;',
            '  min-width:998px !important;',
            '  max-width:1600px !important;',
            '  margin-left:auto !important; margin-right:auto !important;',
            '  box-sizing:border-box !important;',
            '}',
            'body, html { min-width:0 !important; }',
            /* Layout columns are class-tagged by patchWidescreenAttrs,
               anchored to #mainMenu / #tabMenu -- never positional.
               CSS width outranks the HTML width="" presentational hints. */
            '.fjn-menu-col { width:204px !important; }',
            '.fjn-content-col {',
            '  width:auto !important; max-width:none !important;',
            '  padding:0 16px !important; box-sizing:border-box !important;',
            '}',
            'html.fjn-home .fjn-content-col { width:100% !important; }',
            /* Wrapper elements between table.content and body get tagged
               too (index.asp has none; other pages might). */
            '.fjn-wrap {',
            '  width:100% !important; max-width:none !important; min-width:0 !important;',
            '  margin-left:0 !important; margin-right:0 !important;',
            '  box-sizing:border-box !important;',
            '}',

            /* --- Home page shell: stack the two NM halves full-width ---
               Pinning height:auto makes showMenuTree()/set_NM_height()
               inline writes inert (stylesheet-important beats plain inline). */
            '#NM_table { width:100% !important; height:auto !important; min-height:0 !important; padding:0 !important; }',
            '#NM_table_div { display:block !important; width:100% !important; }',
            '.fjn-topo-half, .fjn-status-half {',
            '  float:none !important; width:100% !important; box-sizing:border-box !important;',
            '}',
            '.fjn-topo-half > table {',
            '  float:none !important; width:100% !important; max-width:100% !important; margin:0 !important;',
            '}',
            '.fjn-status-half { margin-top:14px !important; }',
            '.fjn-status-half > table { width:100% !important; float:none !important; }',
            '.fjn-status-half > table > tbody > tr > td { width:100% !important; }',
            '.fjn-status-half .statusTitle { width:100% !important; margin-left:0 !important; box-sizing:border-box !important; }',
            '.fjn-status-half .NM_radius_bottom_container {',
            '  width:100% !important; height:auto !important; margin-left:0 !important;',
            '}',
            /* Dynamic statusframe height: fed into --fjn-sf-h by the height
               reporter attached to the iframe document. The router cannot
               clobber a stylesheet pin. */
            '#statusframe { width:100% !important; height:var(--fjn-sf-h, 760px) !important; }',

            /* --- Topology strip: horizontal, content-driven height --- */
            '.fjn-topo {',
            '  display:flex !important; flex-direction:row !important;',
            '  align-items:stretch !important;',
            '  width:100% !important; height:auto !important; min-height:150px !important;',
            '  background:var(--fjn-bg-page) !important;',
            '}',
            '.fjn-topo > tbody {',
            '  display:flex !important; flex-direction:row !important;',
            '  align-items:stretch !important; width:100% !important;',
            '  gap:6px !important;',
            '}',
            /* Node columns. Five visual nodes share equal width:
               Internet | Router each take 1 unit (.fjn-col, flex 1 1 0);
               the leaf row takes 3 units and splits them across its three
               bands, so every node ends up the same width. flex-basis:0 +
               min-width:0 makes the split exact regardless of text width. */
            '.fjn-col {',
            '  display:flex !important; flex-direction:column !important;',
            '  align-items:stretch !important; justify-content:center !important;',
            '  flex:1 1 0 !important; min-width:0 !important;',
            '  background:var(--fjn-block-bg) !important;',
            '  border:1px solid var(--fjn-border-menu) !important;',
            '}',
            /* Leaf row holds the three leaf nodes side by side (Clients,
               AiMesh, USB), so it is 3 units wide and lays out as a row. */
            /* Leaf row is a transparent gap-container; its three sub-cards
               (Clients, AiMesh, USB) each get their own border/background. */
            '.fjn-topo .fjn-col-leaf {',
            '  flex-direction:row !important; align-items:stretch !important;',
            '  justify-content:flex-start !important; flex:3 1 0 !important;',
            '  background:var(--fjn-bg-page) !important; border:none !important;',
            '  gap:6px !important; padding:0 !important;',
            '}',
            /* Connector rows: collapsed out of the flex layout entirely.
               display:none removes the row and its gap from the strip.
               Belt-and-suspenders for the dual-WAN lines (router hides
               them in single-WAN mode; keep them gone regardless). */
            '.fjn-connector { display:none !important; }',
            '.fjn-topo #primary_wan_line, .fjn-topo #secondary_wan_line { display:none !important; }',
            /* The two layout-spacer cells are exactly the rowspan cells */
            '.fjn-topo td[rowspan] { display:none !important; }',
            /* Card cells -- shared surface, then per-cell extras */
            '.fjn-topo .NM_radius_left, .fjn-topo .NM_radius_right, .fjn-topo .NM_radius {',
            '  width:auto !important; min-width:0 !important;',
            '  box-shadow:none !important; background:var(--fjn-block-bg) !important;',
            '}',
            '.fjn-topo .NM_radius_left {',
            '  height:auto !important;',
            '  display:flex !important; justify-content:center !important; align-items:center !important;',
            '  text-align:center !important; padding:8px 10px 4px !important;',
            '}',
            '.fjn-topo .NM_radius_left #iconInternet, .fjn-topo .NM_radius_left #iconRouter { margin:0 !important; }',
            '.fjn-topo .NM_radius_right {',
            '  height:auto !important; padding:4px 12px 8px !important;',
            '  text-align:center !important; font-size:11px !important; line-height:1.5 !important;',
            '}',
            /* Router inline-styles bold child tags at 14px+; cap them so Security
               card text matches the rest of the strip. Keep some weight. */
            '.fjn-topo .NM_radius_right b, .fjn-topo .NM_radius_right strong {',
            '  font-size:12px !important; font-weight:600 !important;',
            '}',
            /* Three leaf nodes laid out across the leaf row. clients_td is a
               flex row of two equal nodes (Clients + AiMesh) -> 2 units;
               usb_td is the third node -> 1 unit. Each is one icon + label,
               so all three match the Internet/Router node height. Vertical
               rules between them; min-width:0 lets labels shrink/wrap rather
               than blow out the equal-width split. */
            /* clients_td is class="NM_radius" so NM_radius rule would fill it
               with block-bg, making the gap between clientsContainer and
               ameshContainer invisible. Override to page-bg so the gap shows. */
            '.fjn-topo #clients_td {',
            '  display:flex !important; flex-direction:row !important;',
            '  align-items:stretch !important; justify-content:flex-start !important;',
            '  flex:2 1 0 !important; min-width:0 !important; padding:0 !important;',
            '  box-sizing:border-box !important; gap:6px !important;',
            '  background:var(--fjn-bg-page) !important; border:none !important;',
            '}',
            '.fjn-topo #clientsContainer, .fjn-topo #ameshContainer {',
            '  display:flex !important; flex-direction:column !important;',
            '  align-items:center !important; justify-content:center !important;',
            '  flex:1 1 0 !important; min-width:0 !important; width:auto !important;',
            '  text-align:center !important; padding:12px 8px !important; box-sizing:border-box !important;',
            '  gap:8px !important;',
            '  background:var(--fjn-block-bg) !important;',
            '  border:1px solid var(--fjn-border-menu) !important;',
            '}',
            /* USB band rules key on .fjn-band, which the tag pass adds ONLY
               when the router shows usb_td -- a bare display:flex on the id
               would defeat the router's legitimate hide on no-USB configs. */
            '.fjn-topo #usb_td.fjn-band {',
            '  min-height:0 !important;',
            '  display:flex !important; flex-direction:column !important;',
            '  align-items:center !important; justify-content:center !important;',
            '  text-align:center !important;',
            '  flex:1 1 0 !important; min-width:0 !important;',
            '  padding:12px 6px !important; box-sizing:border-box !important;',
            '  gap:8px !important;',
            '  border:1px solid var(--fjn-border-menu) !important;',
            '}',
            /* Dual-WAN degradation: stock topology, centered in the column.
               Must outrank .fjn-topo-half > table (0,1,1), hence the
               compound selector (0,2,1). */
            '.fjn-topo-half > table.fjn-topo-stock {',
            '  width:auto !important; max-width:100% !important; margin:0 auto !important;',
            '}',

            /* Topology icons: background-size uses width+auto so only ONE
               sprite state shows. background-size:contain would scale the
               full sprite sheet (both states) into the box = double image. */
            '#iconInternet, #iconRouter {',
            '  width:60px !important; height:53px !important;',
            '  background-size:60px auto !important;',
            '  margin:0 !important;',
            '}',
            '#iconClient {',
            '  width:60px !important; height:60px !important;',
            '  background-size:60px auto !important;',
            '  margin:0 !important;',
            '}',
            '.iconAMesh, .iconAMesh_dis, .iconNo, .iconNoM2,',
            '.iconUSBdisk, .iconM2, .iconPrinter {',
            '  width:60px !important; height:60px !important;',
            '  background-size:60px auto !important;',
            '  margin:0 !important;',
            '}',

            /* --- Status dashboard grid (statusframe document) --- */
            '.main-block {',
            '  display:grid !important;',
            '  grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)) !important;',
            '  grid-gap:12px !important; gap:12px !important;',
            '  align-items:start !important;',
            '  width:100% !important; box-sizing:border-box !important;',
            '}',
            '.main-block > .display-flex.flex-a-center { grid-column:1 / -1 !important; }',
            '.main-block > .unit-block { width:auto !important; margin:0 !important; box-sizing:border-box !important; }',

            '/* --- Settings pages: fill the widened content column ---',
            '   Stock content tables are pinned ~760px and left-aligned, leaving',
            '   dead space on the right once the chrome is widescreen. Fill the',
            '   form/table content to the column. A <canvas> is fixed-pixel and',
            '   does not stretch, so the outer .FormTitle can always fill; only',
            '   the inner chart .FormTable is kept at its natural size (via',
            '   :has(canvas)) and centered, so graphs/donuts are not left',
            '   stranded with dead space. :has() is supported in current browsers;',
            '   where absent the rule is ignored and the page falls back to the',
            '   stock content -- no worse than before. */',
            '.FormTitle, #FormTitle, .upnp_table { width:100% !important; border-radius:0 !important; }',
            '#tabMenu { max-width:100% !important; }',
            '.FormTable:not(:has(canvas)), .FormTable_table, .FormTable_NWM {',
            '  width:100% !important; border-radius:0 !important;',
            '}',
            '.FormTable:has(canvas) { margin-left:auto !important; margin-right:auto !important; }',
            '.chartCanvas { display:block !important; margin-left:auto !important; margin-right:auto !important; }',
            '/* Title/description divider: stock .splitLine is pinned ~740px and',
            '   no longer spans the widened header; let it fill. */',
            '.splitLine { width:auto !important; }'
        ];

        if (isFrame) {
            /* Rules for the statusframe document itself */
            _p.push('body { margin:0 !important; }');
        }

        _cssCache[key] = _p.join('\n');
        return _cssCache[key];
    }

    // =========================================================
    //  HIDES STYLESHEET (#fujin-hides)
    //  Optional element hides, each behind its own toggle, independent
    //  of theme/layout state (per the release optionality principle).
    // =========================================================

    function buildHidesCSS() {
        if (_cssCache.hides) { return _cssCache.hides; }
        _cssCache.hides = [
            /* View List button (stock layout AND topology strip); the modal
               it opens stays reachable via Network Map > Clients icon. */
            '#clients_td .button_gen { display:none !important; }'
        ].join('\n');
        return _cssCache.hides;
    }

    // =========================================================
    //  STYLE INJECTION
    // =========================================================

    function injectStyleEl(doc, id, cssText) {
        if (!doc || doc.getElementById(id)) { return; }
        var el = doc.createElement('style');
        el.id = id;
        el.textContent = cssText;
        (doc.head || doc.documentElement).appendChild(el);
    }

    // =========================================================
    //  CLASS TAGGING HELPERS
    // =========================================================

    function addClass(el, cls) {
        if (el && (' ' + el.className + ' ').indexOf(' ' + cls + ' ') === -1) {
            el.className = (el.className ? el.className + ' ' : '') + cls;
        }
    }

    function closestTd(el) {
        while (el && el.tagName !== 'TD') { el = el.parentElement; }
        return el;
    }

    // =========================================================
    //  WIDESCREEN ATTRIBUTE PASS (one shot)
    //  Removes the HTML attributes CSS cannot override cleanly and
    //  class-tags the layout columns / wrappers so the stylesheet can
    //  address them. The router JS never rewrites these, so once is
    //  enough.
    // =========================================================

    function patchWidescreenAttrs() {
        var ct = document.querySelector('table.content');
        if (!ct) { return; }
        ct.removeAttribute('align');
        // Anchor the two layout columns by the ids they contain
        var menuTd = closestTd(document.getElementById('mainMenu'));
        if (menuTd) {
            menuTd.removeAttribute('width');
            addClass(menuTd, 'fjn-menu-col');
        }
        var contentTd = closestTd(document.getElementById('tabMenu'));
        if (contentTd) {
            contentTd.removeAttribute('width');
            addClass(contentTd, 'fjn-content-col');
        }
        // Wrappers between table.content and body: tag, do not inline-write
        var el = ct.parentElement;
        while (el && el !== document.body && el !== document.documentElement) {
            addClass(el, 'fjn-wrap');
            el = el.parentElement;
        }
    }

    // =========================================================
    //  NETWORK MAP TAG PASS (one shot, idempotent)
    //  Tags the home-page network map with fjn-* classes; all visual
    //  styling lives in the layout stylesheet keyed to these classes.
    //  Rows are identified by the ids they contain, not by index.
    //  No-op on non-home pages; tags fjn-topo-stock (and stops) in
    //  dual-WAN mode.
    // =========================================================

    function tagNetworkMapHome() {
        var nmDiv = document.getElementById('NM_table_div');
        if (!nmDiv) { return; }
        addClass(document.documentElement, 'fjn-home');

        var kids = nmDiv.children;
        var i;
        for (i = 0; i < kids.length; i++) {
            if (kids[i].querySelector && kids[i].querySelector('#statusframe')) {
                addClass(kids[i], 'fjn-status-half');
            } else {
                addClass(kids[i], 'fjn-topo-half');
            }
        }

        var topoHalf = nmDiv.querySelector('.fjn-topo-half');
        var topoTable = topoHalf ? topoHalf.getElementsByTagName('table')[0] : null;
        if (!topoTable) { return; }

        // Dual-WAN guard: the strip is designed against the single-WAN
        // geometry. Tag the deliberate degradation so it is visible in
        // the DOM and CSS-addressable, then leave the stock layout alone.
        var swIcon = document.getElementById('single_wan_icon');
        var single = swIcon && window.getComputedStyle(swIcon).display !== 'none';
        if (!single) {
            addClass(topoTable, 'fjn-topo-stock');
            return;
        }

        addClass(topoTable, 'fjn-topo');

        // Role classes: only .fjn-col / .fjn-connector carry styling today;
        // the -internet/-router/-leaf suffixes are stable hooks for
        // per-column rules (used during live tuning).
        var rows = topoTable.getElementsByTagName('tr');
        var r;
        for (i = 0; i < rows.length; i++) {
            r = rows[i];
            if (!r.querySelector) { continue; }
            if (r.querySelector('#single_wan_icon, #primary_wan_icon')) {
                addClass(r, 'fjn-col'); addClass(r, 'fjn-col-internet');
            } else if (r.querySelector('#single_wan_line, #primary_wan_line')) {
                addClass(r, 'fjn-connector');
            } else if (r.querySelector('#iconRouter')) {
                addClass(r, 'fjn-col'); addClass(r, 'fjn-col-router');
            } else if (r.querySelector('#line3_single, #line3_img')) {
                addClass(r, 'fjn-connector');
            } else if (r.querySelector('#clients_td, #usb_td')) {
                addClass(r, 'fjn-col'); addClass(r, 'fjn-col-leaf');
            }
        }

        // USB band: tag only when the router shows it. On no-USB configs
        // initial() hides usb_td -- our band rule must not resurrect it.
        var usbTd = document.getElementById('usb_td');
        if (usbTd && window.getComputedStyle(usbTd).display !== 'none') {
            addClass(usbTd, 'fjn-band');
        }

        // align="" on the icon cells fights flex centering; CSS cannot
        // remove an attribute, so strip it here (one shot).
        var tds = topoTable.getElementsByTagName('td');
        for (i = 0; i < tds.length; i++) {
            if ((tds[i].className || '').indexOf('NM_radius_left') !== -1) {
                tds[i].removeAttribute('align');
            }
        }
    }

    // =========================================================
    //  STATUSFRAME HEIGHT REPORTER
    //  Measures the iframe document's TRUE content height and feeds the
    //  top document's --fjn-sf-h custom property. Attached from BOTH the
    //  in-frame script instance and the top instance's load handler;
    //  a marker attribute on the frame's <html> ensures only one
    //  reporter per document.
    //
    //  Measurement: body.offsetHeight -- the body element's own border
    //  box. This is viewport-INDEPENDENT (reads the true content height
    //  even while the iframe is pinned shorter, where documentElement's
    //  scrollHeight/clientHeight would report the clamped viewport) and
    //  shrink-CAPABLE (drops when content shrinks, unlike scrollHeight
    //  which floors at the current iframe height and ratchets up).
    //
    //  Triggers: a MutationObserver on the body subtree catches the
    //  async innerHTML content swaps the device-map pages make (the
    //  ResizeObserver misses them -- the growth happens inside overflow
    //  containers without changing body's observed box until reflow).
    //  NOTE: requestAnimationFrame does NOT fire reliably inside this
    //  iframe (verified live), so scheduling uses setTimeout, never rAF
    //  -- an rAF debounce deadlocks (the flag never resets, so observer
    //  callbacks short-circuit forever). A low-frequency self-cleaning
    //  interval is the final safety net so correctness never hinges on
    //  any single observer. The 3px deadband suppresses idle churn.
    // =========================================================

    function attachHeightReporter(iWin, iDoc) {
        if (!iWin || !iDoc || !iDoc.documentElement || !iDoc.body) { return; }
        if (iDoc.documentElement.getAttribute('data-fjn-reporter') === '1') { return; }
        iDoc.documentElement.setAttribute('data-fjn-reporter', '1');
        var topRoot;
        try { topRoot = iWin.parent.document.documentElement; } catch (e) { return; }

        var lastH = -1;
        var timer = null;

        function measure() {
            timer = null;
            if (!iDoc.body) { return; }
            var h = iDoc.body.offsetHeight;   // true content box: viewport-independent + shrink-capable
            if (h > 40 && Math.abs(h - lastH) > 3) {
                lastH = h;
                topRoot.style.setProperty('--fjn-sf-h', (h + 4) + 'px');
            }
        }
        function schedule() {
            if (timer) { return; }
            timer = iWin.setTimeout(measure, 60);   // setTimeout, not rAF (see note)
        }

        if (typeof iWin.MutationObserver !== 'undefined') {
            try {
                new iWin.MutationObserver(schedule).observe(iDoc.body, {
                    childList: true, subtree: true, characterData: true
                });
            } catch (e) {}
        }
        if (typeof iWin.ResizeObserver !== 'undefined') {
            try { new iWin.ResizeObserver(schedule).observe(iDoc.body); } catch (e) {}
        }
        // Safety net: re-measure on a slow cadence regardless of observers.
        // Matches the device-map pages' own 2-3s update loops, deadbanded
        // so idle ticks cost only one offsetHeight read. Self-cleans when
        // the observed document is navigated away (new doc, new reporter).
        var ivl = iWin.setInterval(function () {
            if (!iDoc.body || !iDoc.defaultView) { iWin.clearInterval(ivl); return; }
            measure();
        }, 2000);

        measure();                       // direct synchronous first value
        iWin.setTimeout(measure, 400);   // settle async first paint
        iWin.setTimeout(measure, 1200);
    }

    // =========================================================
    //  STATUSFRAME WATCH (runs in the TOP document)
    //  On every iframe navigation: ensure the stylesheets exist in the
    //  new document and a height reporter is attached. Backup to the
    //  in-frame script instance (covers VM configs that skip frames).
    // =========================================================

    function watchStatusframe() {
        var sf = document.getElementById('statusframe');
        if (!sf) { return; }
        function onLoad() {
            var iWin, iDoc, iPath;
            try {
                iWin = sf.contentWindow;
                iDoc = sf.contentDocument || (iWin && iWin.document);
                iPath = iWin.location.pathname;
            } catch (e) { iDoc = null; }
            if (!iDoc || !iDoc.body) { return; }
            // Same gate as the in-frame branch: only device-map documents.
            // The router transiently loads index.asp into the frame via
            // statusframe.src="" -- theming or measuring that nested copy
            // would balloon the panel.
            if (!iPath || iPath.indexOf('/device-map/') !== 0) { return; }
            if (loadSetting('theme')) { injectStyleEl(iDoc, 'fujin-theme', buildThemeCSS()); }
            if (loadSetting('widescreenLayout')) {
                injectStyleEl(iDoc, 'fujin-layout', buildLayoutCSS(true));
                attachHeightReporter(iWin, iDoc);
            }
        }
        sf.addEventListener('load', onLoad);
        onLoad();
    }

    // =========================================================
    //  SETTINGS BUTTON + PANEL
    // =========================================================

    var _panelOutsideHandler = null;

    function detachPanelOutsideClick() {
        if (_panelOutsideHandler) {
            document.removeEventListener('click', _panelOutsideHandler);
            _panelOutsideHandler = null;
        }
    }

    function closePanel(panel) {
        panel.style.display = 'none';
        detachPanelOutsideClick();
    }

    function attachPanelOutsideClick(panel) {
        detachPanelOutsideClick();
        setTimeout(function () {
            _panelOutsideHandler = function (e) {
                var btn = document.getElementById('fjn_settings_btn');
                if (!panel.contains(e.target) && (!btn || !btn.contains(e.target))) {
                    closePanel(panel);
                }
            };
            document.addEventListener('click', _panelOutsideHandler);
        }, 0);
    }

    function buildSettingsPanel() {
        var panel = document.getElementById('fjn_settings_panel');
        if (panel) {
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                attachPanelOutsideClick(panel);
            } else {
                closePanel(panel);
            }
            return;
        }

        panel = document.createElement('div');
        panel.id = 'fjn_settings_panel';
        panel.style.cssText = 'position:fixed;top:60px;right:12px;z-index:99999;' +
            'background:' + FUJIN.bgDark + ';' +
            'border:1px solid ' + FUJIN.borderMenu + ';' +
            'min-width:220px;font-family:' + FUJIN.fontBase + ';' +
            'font-size:13px;color:' + FUJIN.textPrimary + ';' +
            'box-shadow:0 4px 16px ' + FUJIN.shadowColor + ';';

        function rowHTML(key) {
            var on = loadSetting(key);
            return '<div data-fjn-key="' + key + '" style="padding:7px 12px;cursor:pointer;' +
                'border-bottom:1px solid ' + FUJIN.borderDark + ';' +
                'display:flex;justify-content:space-between;align-items:center;">' +
                '<span>' + SETTING_LABELS[key] + '</span>' +
                '<span style="font-size:11px;margin-left:12px;color:' +
                (on ? FUJIN.ghz24 : FUJIN.textMuted) + ';">' +
                (on ? '[ON]' : '[OFF]') + '</span>' +
                '</div>';
        }

        var html =
            '<div style="background:' + FUJIN.bgTitle + ';padding:8px 12px;' +
            'display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-weight:bold;">Merlin\'s Cloak</span>' +
            '<span id="fjn_close" style="cursor:pointer;padding:0 4px;' +
            'color:' + FUJIN.textSecondary + ';">x</span>' +
            '</div>';
        var k;
        for (k = 0; k < SETTING_ORDER.length; k++) {
            html += rowHTML(SETTING_ORDER[k]);
        }

        panel.innerHTML = html;

        var allRows = panel.querySelectorAll('[data-fjn-key]');
        var i;
        for (i = 0; i < allRows.length; i++) {
            (function (row) {
                row.addEventListener('mouseover', function () { row.style.backgroundColor = FUJIN.navBg; });
                row.addEventListener('mouseout',  function () { row.style.backgroundColor = ''; });
                row.addEventListener('click', function () {
                    var key = row.getAttribute('data-fjn-key');
                    saveSetting(key, !loadSetting(key));
                    location.reload();
                });
            }(allRows[i]));
        }

        panel.querySelector('#fjn_close').addEventListener('click', function () {
            closePanel(panel);
        });

        document.body.appendChild(panel);
        attachPanelOutsideClick(panel);
    }

    function injectSettingsButton() {
        if (document.getElementById('fjn_settings_btn')) { return; }
        if (!document.body) { return; }
        var btn = document.createElement('div');
        btn.id = 'fjn_settings_btn';
        btn.textContent = '[=]';
        btn.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99998;cursor:pointer;' +
            'color:' + FUJIN.textSecondary + ';font-size:13px;' +
            'font-family:' + FUJIN.fontBase + ';' +
            'padding:6px 12px;' +
            'border:1px solid ' + FUJIN.borderMenu + ';' +
            'background:' + FUJIN.bgDark + ';';
        btn.addEventListener('click', function () { buildSettingsPanel(); });
        document.body.appendChild(btn);
    }

    function registerMenuCommands() {
        if (typeof GM_registerMenuCommand !== 'function') { return; }
        var i;
        for (i = 0; i < SETTING_ORDER.length; i++) {
            (function (key) {
                GM_registerMenuCommand(
                    (loadSetting(key) ? '[ON]  ' : '[OFF] ') + SETTING_LABELS[key],
                    function () { saveSetting(key, !loadSetting(key)); location.reload(); }
                );
            }(SETTING_ORDER[i]));
        }
    }

    // =========================================================
    //  INIT
    //  @run-at document-end means the DOM is ready and the router's
    //  synchronous initial() work (menu build, NM_table inline height,
    //  dual-WAN setup) has already happened -- everything below runs
    //  once, after it.
    // =========================================================

    var IS_FRAME = (window.self !== window.top);

    if (IS_FRAME) {
        // Only the device-map documents inside #statusframe get work.
        // This skips hidden_frame and the index.asp-inside-statusframe
        // state the router creates via statusframe.src="" (flag=Internet/
        // Client) -- reporting that nested page's height would balloon
        // the iframe.
        if (location.pathname.indexOf('/device-map/') === 0) {
            if (loadSetting('theme')) { injectStyleEl(document, 'fujin-theme', buildThemeCSS()); }
            if (loadSetting('widescreenLayout')) {
                injectStyleEl(document, 'fujin-layout', buildLayoutCSS(true));
                attachHeightReporter(window, document);
            }
        }
    } else {
        try {
            if (loadSetting('theme')) { injectStyleEl(document, 'fujin-theme', buildThemeCSS()); }
            if (loadSetting('widescreenLayout')) { injectStyleEl(document, 'fujin-layout', buildLayoutCSS(false)); }
            if (loadSetting('hideViewListBtn')) { injectStyleEl(document, 'fujin-hides', buildHidesCSS()); }
            registerMenuCommands();
            if (loadSetting('widescreenLayout')) {
                patchWidescreenAttrs();
                tagNetworkMapHome();
            }
            if (loadSetting('theme') || loadSetting('widescreenLayout')) {
                watchStatusframe();
            }
            injectSettingsButton();
        } catch (e) {
            console.error('Merlin\'s Cloak init error: ' + e);
        }
    }

})();
