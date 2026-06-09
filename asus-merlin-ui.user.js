// ==UserScript==
// @name         Asus RT-BE92U - Merlin's Cloak
// @namespace    https://github.com/StarlightDaemon/merlins_cloak
// @version      4.4.1
// @description  Fujin theme for AsusWRT-Merlin router admin UI
// @author       StarlightDaemon
// @match        http://192.168.1.1/*
// @match        https://192.168.1.1/*
// @match        http://router.asus.com/*
// @match        https://router.asus.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================
    //  SETTINGS
    // =========================================================

    var SETTINGS_DEFAULTS = {
        theme:           true,
        widescreenLayout: true
    };

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
        borderCard:  '#3a4042',   // card separation (same as navBg)
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
        // Connection type badges (reserved for future client grid)
        wired: '#4a9eff',
        ghz24: '#44cc88',
        ghz5:  '#ffaa33',
        ghz6:  '#cc44ff',
        // Typography -- exact values from tokens.json
        fontBase: '"Verdana", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        fontMono: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Consolas, monospace'
    };

    // =========================================================
    //  FUJIN CSS INJECTION
    //  Builds a stylesheet that overrides Merlin's served CSS.
    //  Uses CSS custom properties on :root so future work can
    //  reference --fjn-* vars in dynamic inline styles.
    //  Direct hex values used where CSS vars don't cross iframes.
    // =========================================================

    function buildFujinCSS() {
        var _p = [
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
            '}',

            /* Scrollbars */
            'html::-webkit-scrollbar-thumb { background-color:var(--fjn-accent-bright) !important; }',
            'html::-webkit-scrollbar-track { background-color:var(--fjn-bg-dark) !important; }',

            /* Page */
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

            /* Text / links */
            '.tab_font_color { color:var(--fjn-text-2) !important; }',
            '.hint-color, .hintColor { color:var(--fjn-text-hint) !important; }',
            '.clients span, .style1, .NMitem a { color:var(--fjn-text-link) !important; }',
            'a:link, a:visited { color:var(--fjn-text) !important; }',

            /* Breadcrumb nav */
            '.nav li { background:var(--fjn-content-bg) !important; }',
            '.nav li a { color:var(--fjn-text) !important; }',
            '.nav li:hover { background-color:var(--fjn-accent-hover) !important; }',

            /* Network Map / statusframe */
            '.statusbody { background-color:var(--fjn-bg-status) !important; border-radius:0 !important; }',
            '.NM_radius_bottom_container { background-color:var(--fjn-bg-status) !important; border-radius:0 !important; }',
            '.NM_table { background-color:var(--fjn-content-bg) !important; border-radius:0 !important; }',
            'table.table1px, .table1px th { background-color:var(--fjn-content-bg) !important; border-color:var(--fjn-content-bg) !important; }',

            /* Status panel -- direct hex because CSS vars do not cross iframe boundaries */
            '.main-block { background:' + FUJIN.bgStatus + ' !important; }',
            '.unit-block { background:' + FUJIN.bgStatus + ' !important; border-radius:0 !important; box-shadow:none !important; color:' + FUJIN.textPrimary + ' !important; }',
            '.division-block { background:' + FUJIN.bgDark + ' !important; color:' + FUJIN.textPrimary + ' !important; border-radius:0 !important; box-shadow:none !important; }',
            '.info-block { background:transparent !important; border-bottom:1px solid ' + FUJIN.borderDark + ' !important; }',
            '.info-title { color:' + FUJIN.textSecondary + ' !important; }',
            '.info-content { color:' + FUJIN.textPrimary + ' !important; }',
            '.statusTitle { background:' + FUJIN.bgDark + ' !important; color:' + FUJIN.textPrimary + ' !important; border-radius:0 !important; box-shadow:none !important; }',
            '.bar-container { background:' + FUJIN.bgDark + ' !important; border-radius:0 !important; }',
            '.core-color-container { border-radius:0 !important; }',
            '.tab-block { background:' + FUJIN.bgStatus + ' !important; border-radius:0 !important; }',
            '.tab-click, .tab-block:hover { background:' + FUJIN.contentBg + ' !important; }',

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
            '}'
        ];

        /* Widescreen layout -- CSS !important beats Asus regular inline styles and
           is timing-independent. JS setProperty runs on top as a belt-and-suspenders
           override for any element Asus JS touches after document-end. */
        if (loadSetting('widescreenLayout')) {
            _p.push(
                /* Target width = clamp(998px,80vw,1600px) via min/width/max so a
                   parser that rejects clamp() does not drop the whole declaration. */
                '.banner1, .statusBar, .minup_bg, table.content {',
                '  width:80vw !important;',
                '  min-width:998px !important;',
                '  max-width:1600px !important;',
                '  margin-left:auto !important; margin-right:auto !important;',
                '  box-sizing:border-box !important;',
                '}',
                /* Content column expands to fill whatever width the table gains */
                'td.bgarrow { width:auto !important; max-width:none !important; }',
                /* Status dashboard (inside the #statusframe iframe): tile the
                   unit-block cards into responsive columns instead of one tall
                   scroll column. auto-fill + minmax keeps it a single column if
                   the iframe stays narrow, so it degrades gracefully. Inert on the
                   main document, which has no .main-block. */
                '.main-block {',
                '  display:grid !important;',
                '  grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)) !important;',
                '  grid-gap:12px !important; gap:12px !important;',
                '  align-items:start !important;',
                '  width:100% !important; box-sizing:border-box !important;',
                '}',
                '.main-block > .display-flex.flex-a-center { grid-column:1 / -1 !important; }',
                '.main-block > .unit-block { width:auto !important; margin:0 !important; box-sizing:border-box !important; }',
                /* Network map container: auto height so the topology strip is compact */
                '#NM_table { width:100% !important; height:auto !important; min-height:0 !important; }'
            );
        }

        return _p.join('\n');
    }

    function injectFujinStyle(doc) {
        if (!doc || doc.getElementById('fujin-theme')) { return; }
        var el = doc.createElement('style');
        el.id = 'fujin-theme';
        el.textContent = buildFujinCSS();
        (doc.head || doc.documentElement).appendChild(el);
    }

    // =========================================================
    //  WIDESCREEN LAYOUT
    //  Expands the 998px fixed layout to clamp(998px,80vw,1600px).
    //  CSS !important handles the static stylesheet rule; JS setProperty
    //  with 'important' beats any Asus inline widths set after load.
    //  Sidebar column is pinned at 204px so it cannot collapse.
    // =========================================================

    function patchWidescreenLayout() {
        function sp(el, prop, val) {
            if (el) { el.style.setProperty(prop, val, 'important'); }
        }
        // Target width = clamp(998px,80vw,1600px) expressed as min/width/max so
        // it survives any parser that chokes on clamp().
        function widen(el) {
            if (!el) { return; }
            sp(el, 'width', '80vw');
            sp(el, 'min-width', '998px');
            sp(el, 'max-width', '1600px');
            sp(el, 'margin-left', 'auto');
            sp(el, 'margin-right', 'auto');
            sp(el, 'box-sizing', 'border-box');
        }

        widen(document.querySelector('.banner1'));
        widen(document.querySelector('.statusBar'));
        widen(document.querySelector('.minup_bg'));

        var ct = document.querySelector('table.content');
        if (ct) {
            ct.removeAttribute('align');
            widen(ct);
            var rows = ct.rows;
            if (rows && rows[0] && rows[0].cells) {
                var cells = rows[0].cells;
                if (cells[1]) { cells[1].removeAttribute('width'); sp(cells[1], 'width', '204px'); }
                if (cells[2]) { cells[2].removeAttribute('width'); sp(cells[2], 'width', 'auto'); sp(cells[2], 'max-width', 'none'); }
            }

            // Walk every ancestor up to body: a wrapper div between table.content
            // and body is the usual 998px constraint. Make wrappers full-width so
            // the clamped table can center inside them.
            var el = ct.parentElement;
            while (el && el !== document.body && el !== document.documentElement) {
                sp(el, 'width', '100%');
                sp(el, 'max-width', 'none');
                sp(el, 'min-width', '0');
                sp(el, 'margin-left', '0');
                sp(el, 'margin-right', '0');
                sp(el, 'box-sizing', 'border-box');
                el = el.parentElement;
            }
        }

        sp(document.body, 'min-width', '0');
        sp(document.documentElement, 'min-width', '0');

        // Home page only (pages with #NM_table_div): make the content cell greedy
        // so the column fills the widened table, then hand off to the network-map
        // dashboard layout (stacks topology over a full-width System Status grid).
        var nmDiv = document.getElementById('NM_table_div');
        if (nmDiv && ct) {
            var r0 = ct.rows && ct.rows[0];
            if (r0 && r0.cells && r0.cells[2]) {
                r0.cells[2].style.setProperty('width', '100%', 'important');
            }
            patchNetworkMapHome();
        }
    }

    // =========================================================
    //  NETWORK MAP TOPOLOGY -- HORIZONTAL LAYOUT
    //  Reshapes the fixed-geometry vertical node chain
    //  (Internet, Router, USB -- top to bottom) into a compact
    //  horizontal strip (left to right).
    //  All element IDs remain intact so router JS keeps working.
    //  No-op when NM_table_div is absent.
    // =========================================================

    function patchTopologyHorizontal() {
        var nmDiv = document.getElementById('NM_table_div');
        if (!nmDiv || !nmDiv.children[0]) { return; }
        var topoTable = nmDiv.children[0].getElementsByTagName('table')[0];
        if (!topoTable) { return; }

        function sp(el, p, v) { if (el) { el.style.setProperty(p, v, 'important'); } }
        function hide(el) { if (el) { sp(el, 'display', 'none'); } }

        // Make the table a horizontal flex row; each <tr> becomes a node column
        sp(topoTable, 'display', 'flex');
        sp(topoTable, 'flex-direction', 'row');
        sp(topoTable, 'align-items', 'stretch');
        sp(topoTable, 'height', 'auto');
        sp(topoTable, 'width', '100%');

        var tbody = topoTable.getElementsByTagName('tbody')[0];
        if (tbody) {
            sp(tbody, 'display', 'flex');
            sp(tbody, 'flex-direction', 'row');
            sp(tbody, 'align-items', 'stretch');
            sp(tbody, 'width', '100%');
        }

        var rows = topoTable.getElementsByTagName('tr');
        var i;
        for (i = 0; i < rows.length; i++) {
            var row = rows[i];
            if (i === 0) {
                // Internet node column
                sp(row, 'display', 'flex');
                sp(row, 'flex-direction', 'column');
                sp(row, 'align-items', 'stretch');
                sp(row, 'flex', '1 1 auto');
                var spacerTd = row.cells && row.cells[0];
                if (spacerTd && spacerTd.getAttribute('rowspan')) { hide(spacerTd); }
            } else if (i === 1) {
                // Connector: reshape vertical bar to horizontal
                sp(row, 'display', 'flex');
                sp(row, 'flex-direction', 'row');
                sp(row, 'align-items', 'center');
                sp(row, 'justify-content', 'center');
                sp(row, 'flex', '0 0 36px');
                var wanBar = document.getElementById('single_wan');
                if (wanBar) {
                    sp(wanBar, 'width', '36px');
                    sp(wanBar, 'height', '4px');
                    sp(wanBar, 'margin', 'auto');
                }
                hide(document.getElementById('primary_wan_line'));
                hide(document.getElementById('secondary_wan_line'));
            } else if (i === 2) {
                // Router node column
                sp(row, 'display', 'flex');
                sp(row, 'flex-direction', 'column');
                sp(row, 'align-items', 'stretch');
                sp(row, 'flex', '1 1 auto');
            } else if (i === 3) {
                // Branch row: replace split-PNG with a simple horizontal connector
                sp(row, 'display', 'flex');
                sp(row, 'flex-direction', 'row');
                sp(row, 'align-items', 'center');
                sp(row, 'justify-content', 'center');
                sp(row, 'flex', '0 0 36px');
                hide(document.getElementById('line3_img'));
                var line3s = document.getElementById('line3_single');
                if (line3s) {
                    sp(line3s, 'display', 'block');
                    sp(line3s, 'width', '36px');
                    sp(line3s, 'height', '4px');
                    sp(line3s, 'margin', 'auto');
                }
            } else if (i === 4) {
                // USB / Clients column
                sp(row, 'display', 'flex');
                sp(row, 'flex-direction', 'column');
                sp(row, 'align-items', 'stretch');
                sp(row, 'flex', '1 1 auto');
                hide(document.getElementById('clientspace_td'));
                hide(document.getElementById('clients_td'));
            }
        }

        // Normalize split-card cells: in horizontal mode the icon (NM_radius_left)
        // stacks on top of the status text (NM_radius_right) within each node column.
        var allTds = topoTable.getElementsByTagName('td');
        var j, cn;
        for (j = 0; j < allTds.length; j++) {
            cn = allTds[j].className || '';
            if (cn.indexOf('NM_radius_left') !== -1) {
                sp(allTds[j], 'width', 'auto');
                sp(allTds[j], 'min-width', '0');
                sp(allTds[j], 'box-shadow', 'none');
                sp(allTds[j], 'text-align', 'center');
                sp(allTds[j], 'padding', '10px');
            } else if (cn.indexOf('NM_radius_right') !== -1) {
                sp(allTds[j], 'width', 'auto');
                sp(allTds[j], 'min-width', '0');
                sp(allTds[j], 'box-shadow', 'none');
                sp(allTds[j], 'padding', '6px 10px');
            } else if (cn.indexOf('NM_radius') !== -1) {
                sp(allTds[j], 'width', 'auto');
                sp(allTds[j], 'min-width', '0');
                sp(allTds[j], 'box-shadow', 'none');
            }
        }
    }

    // =========================================================
    //  NETWORK MAP HOME -- full-width status dashboard
    //  Stacks the topology strip (horizontal) over the status
    //  panel (full width). Status cards are tiled into columns
    //  by the grid CSS injected into the iframe; height is
    //  auto-fit by fitStatusframeHeight().
    //  No-op on any page without #NM_table_div.
    // =========================================================

    function patchNetworkMapHome() {
        var nmDiv = document.getElementById('NM_table_div');
        if (!nmDiv) { return; }
        function sp(el, p, v) { if (el) { el.style.setProperty(p, v, 'important'); } }

        sp(nmDiv, 'width', '100%');
        sp(nmDiv, 'display', 'block');

        var kids = nmDiv.children;
        var i;
        for (i = 0; i < kids.length; i++) {
            var half = kids[i];
            sp(half, 'float', 'none');
            sp(half, 'width', '100%');
            sp(half, 'box-sizing', 'border-box');

            var innerT = half.getElementsByTagName('table')[0];
            if (half.querySelector && half.querySelector('#statusframe')) {
                // System Status half -> fill the full width
                sp(half, 'margin-top', '14px');
                if (innerT) {
                    sp(innerT, 'width', '100%');
                    sp(innerT, 'float', 'none');
                    sp(innerT.getElementsByTagName('td')[0], 'width', '100%');
                }
                sp(half.querySelector('.NM_radius_bottom_container'), 'width', '100%');
                sp(half.querySelector('#statusframe'), 'width', '100%');
            } else if (innerT) {
                // Topology half -> fill full width; horizontal layout applied below
                sp(innerT, 'float', 'none');
                sp(innerT, 'width', '100%');
                sp(innerT, 'max-width', '100%');
                sp(innerT, 'margin-left', '0');
                sp(innerT, 'margin-right', '0');
            }
        }

        // Reshape vertical node chain into a horizontal left-to-right strip
        patchTopologyHorizontal();

        // Shrink the outer NM_table container to wrap only its contents
        var nmTableCont = document.getElementById('NM_table');
        if (nmTableCont) {
            sp(nmTableCont, 'width', '100%');
            sp(nmTableCont, 'height', 'auto');
            sp(nmTableCont, 'min-height', '0');
            sp(nmTableCont, 'padding-bottom', '10px');
        }
    }

    // Auto-fit the statusframe iframe height to its (reflowed) content so the
    // internal scrollbar disappears. Same-origin, so contentDocument is readable.
    function fitStatusframeHeight() {
        var sf = document.getElementById('statusframe');
        if (!sf) { return; }
        var iDoc = sf.contentDocument || (sf.contentWindow && sf.contentWindow.document);
        if (!iDoc || !iDoc.body) { return; }
        var h = iDoc.body.scrollHeight;
        if (h && h > 80) { sf.style.setProperty('height', (h + 10) + 'px', 'important'); }
    }

    // =========================================================
    //  STATUSFRAME THEME INJECTION
    //  The statusframe iframe is same-origin but loads separately.
    //  Inject the theme into it whenever it (re)loads.
    // =========================================================

    function watchStatusframe() {
        var sf = document.getElementById('statusframe');
        if (!sf) { return; }
        var _retries = 0;
        function tryInject() {
            if (_retries++ > 20) { return; }
            var iDoc = sf.contentDocument || (sf.contentWindow && sf.contentWindow.document);
            if (iDoc && iDoc.body && iDoc.readyState !== 'loading') {
                injectFujinStyle(iDoc);
                if (loadSetting('widescreenLayout')) {
                    iDoc.body.style.setProperty('margin', '0', 'important');
                    patchNetworkMapHome();
                    setTimeout(fitStatusframeHeight, 300);
                    setTimeout(fitStatusframeHeight, 1000);
                    setTimeout(fitStatusframeHeight, 2500);
                }
                return;
            }
            setTimeout(tryInject, 300);
        }
        sf.addEventListener('load', function () {
            _retries = 0;
            tryInject();
        });
        tryInject();
    }

    // =========================================================
    //  SETTINGS BUTTON + PANEL
    // =========================================================

    var _panelOutsideHandler = null;

    function attachPanelOutsideClick(panel) {
        if (_panelOutsideHandler) {
            document.removeEventListener('click', _panelOutsideHandler);
        }
        setTimeout(function () {
            _panelOutsideHandler = function (e) {
                var btn = document.getElementById('fjn_settings_btn');
                if (!panel.contains(e.target) && (!btn || !btn.contains(e.target))) {
                    panel.style.display = 'none';
                    document.removeEventListener('click', _panelOutsideHandler);
                    _panelOutsideHandler = null;
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
                panel.style.display = 'none';
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
            'box-shadow:0 4px 16px rgba(0,0,0,0.5);';

        var themeOn = loadSetting('theme');
        var wsOn    = loadSetting('widescreenLayout');

        function rowHTML(key, label, on) {
            return '<div data-fjn-key="' + key + '" style="padding:7px 12px;cursor:pointer;' +
                'border-bottom:1px solid ' + FUJIN.borderDark + ';' +
                'display:flex;justify-content:space-between;align-items:center;">' +
                '<span>' + label + '</span>' +
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
            '</div>' +
            rowHTML('theme',           'Fujin Theme',       themeOn) +
            rowHTML('widescreenLayout', 'Widescreen Layout', wsOn);

        panel.innerHTML = html;

        var allRows = panel.querySelectorAll('[data-fjn-key]');
        var i;
        for (i = 0; i < allRows.length; i++) {
            (function (row) {
                row.addEventListener('mouseover', function () { row.style.backgroundColor = FUJIN.navBg; });
                row.addEventListener('mouseout',  function () { row.style.backgroundColor = ''; });
                row.addEventListener('click', function () {
                    var k = row.getAttribute('data-fjn-key');
                    saveSetting(k, !loadSetting(k));
                    location.reload();
                });
            }(allRows[i]));
        }

        panel.querySelector('#fjn_close').addEventListener('click', function () {
            panel.style.display = 'none';
        });

        document.body.appendChild(panel);
        attachPanelOutsideClick(panel);
    }

    function injectSettingsButton() {
        if (window.self !== window.top) { return; }
        if (document.getElementById('fjn_settings_btn')) { return; }
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
        var themeOn = loadSetting('theme');
        var wsOn    = loadSetting('widescreenLayout');
        GM_registerMenuCommand(
            (themeOn ? '[ON]  ' : '[OFF] ') + 'Fujin Theme',
            function () { saveSetting('theme', !loadSetting('theme')); location.reload(); }
        );
        GM_registerMenuCommand(
            (wsOn ? '[ON]  ' : '[OFF] ') + 'Widescreen Layout',
            function () { saveSetting('widescreenLayout', !loadSetting('widescreenLayout')); location.reload(); }
        );
    }

    // =========================================================
    //  INIT
    // =========================================================

    if (loadSetting('theme')) { injectFujinStyle(document); }
    registerMenuCommands();

    window.addEventListener('load', function () {
        if (loadSetting('theme')) { watchStatusframe(); }
        if (loadSetting('widescreenLayout')) {
            patchWidescreenLayout();
            setTimeout(patchWidescreenLayout, 300);
            setTimeout(patchWidescreenLayout, 800);
            setTimeout(patchWidescreenLayout, 1500);
            setTimeout(patchWidescreenLayout, 3000);
            setTimeout(fitStatusframeHeight, 3500);
        }
        injectSettingsButton();
    });

})();
