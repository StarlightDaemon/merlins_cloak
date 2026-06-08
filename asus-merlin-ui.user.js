// ==UserScript==
// @name         Asus RT-BE92U - Merlin UI Customizer
// @namespace    https://github.com/local/asus-merlin-ui
// @version      3.1.6
// @description  Hides unwanted menu items, reorders nav, logo home link, firmware info in status panel, Fujin theme injection
// @author       Heath
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
    //  HIDE LIST
    //  Plain object used instead of Set for ES5 compatibility.
    //  To unhide any item, remove its entry from this object.
    // =========================================================

    var HIDE_IDS = {
        'AiProtection_HomeProtection_menu': true,   // AiProtection
        'AiProtection_WebProtector_menu':   true,   // Parental Controls
        'APP_Installation_menu':            true,   // USB Application
        'Advanced_Smart_Home_Alexa_menu':   true,   // Amazon Alexa
        'QIS_wizard_menu':                  true    // Quick Internet Setup
    };

    // =========================================================
    //  SETTINGS
    //  Persisted via GM_setValue when available, localStorage
    //  otherwise (scoped to 192.168.1.1). All defaults are true.
    // =========================================================

    var SETTINGS_DEFAULTS = {
        theme:            true,
        fluidLayout:      true,
        menuReorder:      true,
        clientList:       true,
        routerInfo:       true,
        logoLink:         true,
        hideAiProtection: true,
        hideParental:     true,
        hideUsb:          true,
        hideAlexa:        true,
        hideQis:          true
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

    function getHideIds() {
        var ids = {};
        if (loadSetting('hideAiProtection')) { ids['AiProtection_HomeProtection_menu'] = true; }
        if (loadSetting('hideParental'))     { ids['AiProtection_WebProtector_menu']   = true; }
        if (loadSetting('hideUsb'))          { ids['APP_Installation_menu']            = true; }
        if (loadSetting('hideAlexa'))        { ids['Advanced_Smart_Home_Alexa_menu']   = true; }
        if (loadSetting('hideQis'))          { ids['QIS_wizard_menu']                  = true; }
        return ids;
    }

    // =========================================================
    //  LAYOUT
    //  Full menu order. Hidden items kept in logical position
    //  so removing from HIDE_IDS above restores them correctly.
    // =========================================================

    var LAYOUT = [
        { type: 'SEPARATOR', label: 'General' },
        { type: 'MENU', id: 'index_menu' },                          // Network Map
        { type: 'MENU', id: 'client_list_menu' },                    // Client List [custom]
        { type: 'MENU', id: 'AiMesh_menu' },                         // AiMesh
        { type: 'MENU', id: 'SDN_menu' },                            // Network
        { type: 'MENU', id: 'AiProtection_HomeProtection_menu' },    // AiProtection [hidden]
        { type: 'MENU', id: 'AiProtection_WebProtector_menu' },      // Parental Controls [hidden]
        { type: 'MENU', id: 'AdaptiveQoS_Bandwidth_Monitor_menu' },  // Adaptive QoS
        { type: 'MENU', id: 'Main_TrafficMonitor_realtime_menu' },   // Traffic Analyzer

        { type: 'SEPARATOR', label: 'Network Settings' },
        { type: 'MENU', id: 'Advanced_Wireless_Content_menu' },      // Wireless
        { type: 'MENU', id: 'Advanced_LAN_Content_menu' },           // LAN
        { type: 'MENU', id: 'Advanced_WAN_Content_menu' },           // WAN
        { type: 'MENU', id: 'Advanced_IPv6_Content_menu' },          // IPv6
        { type: 'MENU', id: 'Advanced_VPNStatus_menu' },             // VPN
        { type: 'MENU', id: 'Advanced_BasicFirewall_Content_menu' }, // Firewall

        { type: 'SEPARATOR', label: 'System Tools' },
        { type: 'MENU', id: 'Advanced_OperationMode_Content_menu' }, // Administration
        { type: 'MENU', id: 'Tools_Sysinfo_menu' },                  // System Info
        { type: 'MENU', id: 'Main_LogStatus_Content_menu' },         // System Log
        { type: 'MENU', id: 'Main_Analysis_Content_menu' },          // Network Tools
        { type: 'MENU', id: 'APP_Installation_menu' },               // USB Application [hidden]
        { type: 'MENU', id: 'Advanced_Smart_Home_Alexa_menu' },      // Amazon Alexa [hidden]
        { type: 'MENU', id: 'QIS_wizard_menu' }                      // Quick Internet Setup [hidden]
    ];

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
        // Connection type badges (client grid)
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
    //  Uses CSS custom properties defined on :root so the client
    //  grid's dynamic inline styles can reference --fjn-* vars
    //  if needed in future iterations.
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
            'body { background-color:var(--fjn-bg-page) !important; color:var(--fjn-text) !important; min-width:0 !important; }',

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
            /* Language dropdown (navigation li dt uses same PNG as titledropdownbtn) */
            '.navigation li dt { background-image:none !important; background-color:var(--fjn-bg-dark) !important; }',
            '.navigation li dt:hover { background-image:none !important; background-color:var(--fjn-accent-btn) !important; }',
            '.navigation li dd { background-color:var(--fjn-bg-dark) !important; border-bottom:1px solid var(--fjn-border-menu) !important; }',
            '.navigation li dd:hover { background-color:var(--fjn-accent-btn) !important; }',
            /* Status bar row (midup_bg.png tile) and main content area (middown_bg.png tile) */
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

            /* Status panel -- backgrounds stripped pending full redo */
            '.unit-block { background:transparent !important; border-radius:0 !important; box-shadow:none !important; }',
            '.division-block { background:transparent !important; border-radius:0 !important; box-shadow:none !important; }',
            '.info-block { background:transparent !important; border-bottom:1px solid #333 !important; }',
            '.statusTitle { background:transparent !important; border-radius:0 !important; box-shadow:none !important; }',
            '.bar-container { border-radius:0 !important; }',
            '.core-color-container { border-radius:0 !important; }',
            '.tab-block { background:transparent !important; border-radius:0 !important; }',
            '.tab-click, .tab-block:hover { background:transparent !important; }',

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
        if (loadSetting('fluidLayout')) {
            _p.push(
                '.banner1 { width:100% !important; box-sizing:border-box !important; }',
                '.statusBar, .minup_bg { width:100% !important; max-width:100% !important; box-sizing:border-box !important; }',
                'table.content { width:100% !important; table-layout:auto !important; }',
                'td.bgarrow { width:auto !important; max-width:none !important; }',
                '.NM_table { width:100% !important; }',
                '#NM_table_div { width:100% !important; display:flex !important; }',
                '#NM_table_div > div { flex:1 1 50% !important; min-width:0 !important; }',
                '#statusframe { width:100% !important; min-width:260px !important; box-sizing:border-box !important; }',
                '@media (min-width:1400px) {',
                '  .FormTable { max-width:860px !important; }',
                '  .FormTitle { max-width:860px !important; }',
                '}'
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
    //  LOGO -> HOME LINK
    // =========================================================

    function makeLogoLink() {
        var img = document.querySelector('img[src*="asustitle"]');
        if (!img || img.parentElement.tagName === 'A') { return; }

        var anchor = document.createElement('a');
        anchor.href  = 'index.asp';
        anchor.title = 'Home';
        anchor.style.cssText = 'display:block; float:left; line-height:0; border:0;';

        img.parentNode.insertBefore(anchor, img);
        anchor.appendChild(img);
    }

    // =========================================================
    //  MENU MARGIN FIX
    // =========================================================

    function fixMenuMargin() {
        var mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) { return; }

        var firstChild = mainMenu.firstElementChild;
        if (firstChild) {
            firstChild.style.setProperty('margin-top', '-141px', 'important');
        }

        mainMenu.style.setProperty('min-height', '100%', 'important');
    }

    // =========================================================
    //  HIDE TITLEDOWN BAR
    // =========================================================

    function hideTitleDown() {
        var el = document.querySelector('.titledown');
        if (el) { el.style.setProperty('display', 'none', 'important'); }

        var merlinImg = document.querySelector('img[src*="merlin-logo"]');
        if (merlinImg && merlinImg.parentElement) {
            merlinImg.parentElement.style.setProperty('display', 'none', 'important');
        }
    }

    // =========================================================
    //  INJECT ROUTER INFO INTO STATUS IFRAME
    // =========================================================

    function injectRouterInfoIntoIframe() {
        if (!document.getElementById('statusframe')) { return; }

        var swModeEl  = document.getElementById('sw_mode_span');
        var firmverEl = document.getElementById('firmver');
        var swMode    = swModeEl  ? swModeEl.textContent.trim()  : 'Unknown';
        var firmver   = firmverEl ? firmverEl.textContent.trim() : 'Unknown';
        var _retries  = 0;

        function tryInject() {
            if (_retries++ > 20) { return; }
            var iframe = document.getElementById('statusframe');
            if (!iframe) { return; }

            var iDoc = iframe.contentDocument;
            if (!iDoc || !iDoc.body || !iDoc.querySelector('.unit-block')) {
                setTimeout(tryInject, 300);
                return;
            }

            if (iDoc.getElementById('router_info_block')) { return; }

            var block = iDoc.createElement('div');
            block.id        = 'router_info_block';
            block.className = 'unit-block';
            block.innerHTML =
                '<div class="division-block">Router Info</div>' +
                '<div>' +
                    '<div class="info-block">' +
                        '<div class="info-title">Operation Mode</div>' +
                        '<div class="info-content">' + swMode + '</div>' +
                    '</div>' +
                    '<div class="info-block">' +
                        '<div class="info-title">Firmware</div>' +
                        '<div class="info-content">' + firmver + '</div>' +
                    '</div>' +
                '</div>';

            var mainBlock = iDoc.querySelector('.main-block');
            if (mainBlock) {
                mainBlock.appendChild(block);
            }

            var scrollH = iDoc.body.scrollHeight;
            iframe.style.height = scrollH + 'px';
            if (iframe.parentElement) {
                iframe.parentElement.style.setProperty('height', scrollH + 'px', 'important');
            }
        }

        setTimeout(tryInject, 800);

        var iframe = document.getElementById('statusframe');
        if (iframe) {
            iframe.addEventListener('load', function () {
                injectFujinStyle(iframe.contentDocument);
                setTimeout(tryInject, 300);
            });
        }
    }


    // =========================================================
    //  CLIENT LIST GRID
    //  Reads from /update_clients.asp and renders a card grid
    // =========================================================

    window.buildClientGrid = function buildClientGrid() {
        var overlay = document.getElementById('clientgrid_overlay');
        if (overlay) {
            overlay.style.setProperty('display', 'block', 'important');
            refreshClientGrid();
            return;
        }

        overlay = document.createElement('div');
        overlay.id = 'clientgrid_overlay';
        overlay.style.cssText = [
            'position:relative',
            'background:' + FUJIN.bgPage,
            'z-index:50',
            'display:block',
            'overflow-y:auto',
            'min-height:700px',
            'font-family:' + FUJIN.fontBase,
            'width:100%'
        ].join(';');

        overlay.innerHTML = [
            '<div style="padding:16px;">',
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">',
            '<div style="display:flex;gap:8px;" id="cg_tabs">',
            '<button onclick="window._cgTab(this,\'all\')" style="background:' + FUJIN.contentBg + ';color:' + FUJIN.textPrimary + ';border:0;padding:6px 14px;cursor:pointer;font-size:12px;">All</button>',
            '<button onclick="window._cgTab(this,\'wired\')" style="background:' + FUJIN.bgTitle + ';color:' + FUJIN.textSecondary + ';border:0;padding:6px 14px;cursor:pointer;font-size:12px;">Wired</button>',
            '<button onclick="window._cgTab(this,\'wireless\')" style="background:' + FUJIN.bgTitle + ';color:' + FUJIN.textSecondary + ';border:0;padding:6px 14px;cursor:pointer;font-size:12px;">Wireless</button>',
            '<button onclick="window._cgTab(this,\'offline\')" style="background:' + FUJIN.bgTitle + ';color:' + FUJIN.textSecondary + ';border:0;padding:6px 14px;cursor:pointer;font-size:12px;">Offline</button>',
            '</div>',
            '<div style="display:flex;align-items:center;gap:8px;">',
            '<input id="cg_search" onkeyup="window._cgSearch(this.value)" placeholder="Search..." style="background:' + FUJIN.bgTitle + ';color:' + FUJIN.textPrimary + ';border:1px solid ' + FUJIN.contentBg + ';padding:6px 10px;font-size:12px;width:200px;">',
            '<button onclick="window.refreshClientGrid()" style="background:' + FUJIN.bgTitle + ';color:' + FUJIN.textSecondary + ';border:0;padding:6px 14px;cursor:pointer;font-size:12px;">Refresh</button>',
            '</div>',
            '</div>',
            '<div id="cg_grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;"></div>',
            '<div id="cg_loading" style="color:' + FUJIN.textSecondary + ';text-align:center;padding:40px;">Loading clients...</div>',
            '</div>'
        ].join('');

        var contentTd = document.querySelector('td.bgarrow');
        if (contentTd) {
            contentTd.appendChild(overlay);
        }

        window._cgAllClients = [];
        window._cgCurrentTab = 'all';

        window._cgTab = function(btn, tab) {
            window._cgCurrentTab = tab;
            var btns = document.querySelectorAll('#cg_tabs button');
            for (var i = 0; i < btns.length; i++) {
                btns[i].style.background = FUJIN.bgTitle;
                btns[i].style.color = FUJIN.textSecondary;
            }
            btn.style.background = FUJIN.contentBg;
            btn.style.color = FUJIN.textPrimary;
            window._cgRender(window._cgAllClients);
        };

        window._cgSearch = function(val) {
            window._cgRender(window._cgAllClients, val);
        };

        window._cgRender = function(clients, search) {
            var grid = document.getElementById('cg_grid');
            if (!grid) { return; }
            var tab = window._cgCurrentTab;
            var q = (search || document.getElementById('cg_search').value || '').toLowerCase();

            var filtered = [];
            for (var i = 0; i < clients.length; i++) {
                var c = clients[i];
                if (tab === 'offline') {
                    if (c.isOnline) { continue; }
                } else {
                    if (!c.isOnline) { continue; }
                    if (tab === 'wired' && c.isWL !== '0') { continue; }
                    if (tab === 'wireless' && c.isWL === '0') { continue; }
                }
                if (q) {
                    var match = (c.nickName || '').toLowerCase().indexOf(q) > -1 ||
                                (c.ip || '').indexOf(q) > -1 ||
                                (c.mac || '').toLowerCase().indexOf(q) > -1 ||
                                (c.vendor || '').toLowerCase().indexOf(q) > -1;
                    if (!match) { continue; }
                }
                filtered.push(c);
            }

            filtered.sort(function(a, b) {
                var aparts = (a.ip || '').split('.').map(Number);
                var bparts = (b.ip || '').split('.').map(Number);
                for (var j = 0; j < 4; j++) {
                    if (aparts[j] !== bparts[j]) { return aparts[j] - bparts[j]; }
                }
                return 0;
            });

            var connLabel = { '0': 'Wired', '1': '2.4G', '2': '5G', '3': '6G' };
            var connColor = { '0': FUJIN.wired, '1': FUJIN.ghz24, '2': FUJIN.ghz5, '3': FUJIN.ghz6 };

            var html = '';
            for (var k = 0; k < filtered.length; k++) {
                var cl = filtered[k];
                if (tab === 'offline') {
                    html += '<div style="background:' + FUJIN.bgStatus + ';padding:12px;border:1px solid ' + FUJIN.borderCard + ';opacity:0.5;">' +
                        '<div style="margin-bottom:8px;">' +
                        '<div style="font-weight:bold;color:' + FUJIN.textPrimary + ';font-size:13px;word-break:break-word;">' + (cl.nickName || cl.name || cl.mac) + '</div>' +
                        '</div>' +
                        '<div style="font-size:12px;color:' + FUJIN.textMuted + ';margin-bottom:3px;">' + (cl.ip || '') + '</div>' +
                        '<div style="font-size:10px;color:' + FUJIN.textMuted + ';font-family:' + FUJIN.fontMono + ';">' + (cl.mac || '') + '</div>' +
                        (cl.vendor ? '<div style="font-size:10px;color:' + FUJIN.textMuted + ';margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + cl.vendor + '">' + cl.vendor + '</div>' : '') +
                        '</div>';
                } else {
                    var conn = cl.isWL || '0';
                    var label = connLabel[conn] || 'Wired';
                    var color = connColor[conn] || FUJIN.wired;
                    html += '<div style="background:' + FUJIN.bgStatus + ';padding:12px;border:1px solid ' + FUJIN.borderCard + ';">' +
                        '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
                        '<div style="font-weight:bold;color:' + FUJIN.textPrimary + ';font-size:13px;word-break:break-word;flex:1;">' + (cl.nickName || cl.name || cl.mac) + '</div>' +
                        '<div style="background:' + color + ';color:#000;font-size:10px;font-weight:bold;padding:2px 6px;margin-left:6px;white-space:nowrap;">' + label + '</div>' +
                        '</div>' +
                        '<div style="font-size:12px;color:' + FUJIN.textLink + ';margin-bottom:3px;">' + (cl.ip || '') + '</div>' +
                        '<div style="font-size:10px;color:' + FUJIN.textSecondary + ';font-family:' + FUJIN.fontMono + ';">' + (cl.mac || '') + '</div>' +
                        (cl.vendor ? '<div style="font-size:10px;color:' + FUJIN.textMuted + ';margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + cl.vendor + '">' + cl.vendor + '</div>' : '') +
                        '</div>';
                }
            }

            grid.innerHTML = html || '<div style="color:' + FUJIN.textSecondary + ';padding:20px;grid-column:1/-1;">No devices found</div>';
        };

        window.refreshClientGrid();
    };

    window.refreshClientGrid = function refreshClientGrid() {
        var loading = document.getElementById('cg_loading');
        if (loading) { loading.style.display = 'block'; }

        var script = document.createElement('script');
        script.src = '/update_clients.asp?t=' + Date.now();
        script.onload = function() {
            if (loading) { loading.style.display = 'none'; }
            try {
                var clients = [];
                if (typeof originData !== 'undefined' && originData.fromNetworkmapd && originData.fromNetworkmapd.length) {
                    var arr = originData.fromNetworkmapd;
                    for (var i = 0; i < arr.length; i++) {
                        var obj = arr[i];
                        var keys = Object.keys(obj);
                        for (var j = 0; j < keys.length; j++) {
                            clients.push(obj[keys[j]]);
                        }
                    }
                }
                window._cgAllClients = clients;
                window._cgRender(clients);
            } catch(e) {
                console.log('clientgrid error:', e);
            }
            document.head.removeChild(script);
        };
        document.head.appendChild(script);
    };

    // =========================================================
    //  INJECT CLIENT LIST MENU ITEM
    // =========================================================

    function injectClientListMenuItem() {
        if (document.getElementById('client_list_menu')) { return; }

        var item = document.createElement('div');
        item.className = 'menu';
        item.id = 'client_list_menu';
        item.setAttribute('title', 'clientgrid');
        item.setAttribute('onclick',
            '(function(){' +
            'var els = document.querySelectorAll(".menu");' +
            'for(var i=0;i<els.length;i++){ els[i].className="menu"; }' +
            'this.className="menu menuClicked";' +
            'var contentTd = document.querySelector("td.bgarrow");' +
            'if(!contentTd){ return; }' +
            'var children = contentTd.children;' +
            'for(var j=0;j<children.length;j++){' +
            '  if(children[j].id !== "clientgrid_overlay"){' +
            '    children[j].style.setProperty("display","none","important");' +
            '  }' +
            '}' +
            'var statusBar = document.querySelector(".statusBar");' +
            'if(statusBar){ statusBar.style.setProperty("display","none","important"); }' +
            'window.buildClientGrid();' +
            '}).call(this);'
        );
        item.innerHTML =
            '<table><tbody><tr>' +
            '<td><div class="menu_Icon menu_Index"></div></td>' +
            '<td class="menu_Desc">Client List</td>' +
            '</tr></tbody></table>';

        var indexMenu = document.getElementById('index_menu');
        if (indexMenu && indexMenu.parentNode) {
            indexMenu.parentNode.insertBefore(item, indexMenu.nextSibling);
        }
    }

    // =========================================================
    //  HIDE NETWORK MAP CARDS
    // =========================================================

    function hideNetworkMapCards() {
        var isIndex = window.location.pathname.indexOf('index.asp') > -1 ||
                      window.location.pathname === '/';
        if (!isIndex) { return; }

        var viewList = document.querySelector('input[value="View List"]');
        if (viewList && viewList.parentElement) {
            viewList.parentElement.style.setProperty('display', 'none', 'important');
        }

        var usbStatus = document.getElementById('usb_status');
        if (usbStatus && usbStatus.parentElement) {
            usbStatus.parentElement.style.setProperty('display', 'none', 'important');
        }

        var aimeshNodes = document.querySelectorAll('.aimesh_node, #aimesh_node_status, [id*="aimesh_num"]');
        for (var ai = 0; ai < aimeshNodes.length; ai++) {
            aimeshNodes[ai].style.setProperty('display', 'none', 'important');
        }
    }

    // =========================================================
    //  HIDE
    // =========================================================

    function hideMenuItems() {
        var ids = getHideIds();
        var id;
        for (id in ids) {
            if (ids.hasOwnProperty(id)) {
                var el = document.getElementById(id);
                if (el) { el.style.setProperty('display', 'none', 'important'); }
            }
        }
    }

    // =========================================================
    //  REORDER + REGROUP
    // =========================================================

    function buildMenu() {
        var mainMenu = document.getElementById('mainMenu');
        if (!mainMenu) { return; }

        if (mainMenu.getAttribute('data-customized') === '1') {
            hideMenuItems();
            return;
        }

        var existing = {};
        var nodes = mainMenu.querySelectorAll('div.menu, div.menu_Split');
        var i;
        for (i = 0; i < nodes.length; i++) {
            if (nodes[i].id) { existing[nodes[i].id] = nodes[i]; }
        }

        if (!existing['index_menu']) { return; }

        var fragment = document.createDocumentFragment();

        for (i = 0; i < LAYOUT.length; i++) {
            var entry = LAYOUT[i];
            if (entry.type === 'SEPARATOR') {
                var sep = document.createElement('div');
                sep.className = 'menu_Split';
                sep.innerHTML =
                    '<table width="192px" height="30px"><tbody><tr><td>' +
                    entry.label +
                    '</td></tr></tbody></table>';
                fragment.appendChild(sep);

            } else if (entry.type === 'MENU') {
                var el = existing[entry.id];
                if (el) {
                    fragment.appendChild(el);
                    delete existing[entry.id];
                }
            }
        }

        var key;
        for (key in existing) {
            if (existing.hasOwnProperty(key)) {
                if (!existing[key].classList.contains('menu_Split')) {
                    fragment.appendChild(existing[key]);
                }
            }
        }

        mainMenu.innerHTML = '';
        mainMenu.appendChild(fragment);
        mainMenu.setAttribute('data-customized', '1');

        hideMenuItems();
        fixMenuMargin();
    }

    // =========================================================
    //  RESTORE NETWORK MAP
    //  When navigating away from Client List view, restore
    //  the original content TD children
    // =========================================================

    function patchGoToPage() {
        if (typeof goToPage !== 'function') { return; }
        if (goToPage._patched) { return; }

        var _goToPage = goToPage;
        goToPage = function(menu, tab, obj) {
            var clf = document.getElementById('clientgrid_overlay');
            if (clf) {
                clf.style.setProperty('display', 'none', 'important');
                var statusBar = document.querySelector('.statusBar');
                if (statusBar) {
                    statusBar.style.removeProperty('display');
                    statusBar.style.removeProperty('visibility');
                }
                var contentTd = document.querySelector('td.bgarrow');
                if (contentTd) {
                    var children = contentTd.children;
                    for (var i = 0; i < children.length; i++) {
                        if (children[i].id !== 'clientgrid_overlay') {
                            children[i].style.removeProperty('display');
                        }
                    }
                }
            }
            return _goToPage(menu, tab, obj);
        };
        goToPage._patched = true;
    }

    // =========================================================
    //  OBSERVER
    // =========================================================

    function waitForMenu() {
        var mainMenu = document.getElementById('mainMenu');

        if (!mainMenu) {
            if (!document.body) { return; }
            var bodyObs = new MutationObserver(function () {
                var m = document.getElementById('mainMenu');
                if (m) {
                    bodyObs.disconnect();
                    waitForMenu();
                }
            });
            if (document.body) {
                bodyObs.observe(document.body, { childList: true, subtree: false });
            }
            return;
        }

        var menuObs = new MutationObserver(function (mutations, obs) {
            if (document.getElementById('index_menu')) {
                obs.disconnect();
                if (loadSetting('clientList')) { injectClientListMenuItem(); }
                if (loadSetting('menuReorder')) { buildMenu(); } else { hideMenuItems(); }
            }
        });

        menuObs.observe(mainMenu, { childList: true, subtree: true });

        if (document.getElementById('index_menu')) {
            menuObs.disconnect();
            if (loadSetting('clientList')) { injectClientListMenuItem(); }
            if (loadSetting('menuReorder')) { buildMenu(); } else { hideMenuItems(); }
        }
    }

    // =========================================================
    //  SETTINGS PANEL + GM MENU
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

    var SETTING_ROWS = [
        { key: 'theme',            label: 'Fujin Theme' },
        { key: 'fluidLayout',      label: 'Fluid Layout' },
        { key: 'menuReorder',      label: 'Menu Reorder' },
        { key: 'clientList',       label: 'Client List Item' },
        { key: 'routerInfo',       label: 'Router Info Panel' },
        { key: 'logoLink',         label: 'Logo Home Link' },
        { key: null,               label: 'Hidden Items' },
        { key: 'hideAiProtection', label: 'Hide: AiProtection' },
        { key: 'hideParental',     label: 'Hide: Parental Controls' },
        { key: 'hideUsb',          label: 'Hide: USB Application' },
        { key: 'hideAlexa',        label: 'Hide: Amazon Alexa' },
        { key: 'hideQis',          label: 'Hide: Quick Internet Setup' }
    ];

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
            'min-width:230px;font-family:' + FUJIN.fontBase + ';' +
            'font-size:13px;color:' + FUJIN.textPrimary + ';' +
            'box-shadow:0 4px 16px rgba(0,0,0,0.5);';

        var html = '<div style="background:' + FUJIN.bgTitle + ';padding:8px 12px;' +
            'display:flex;justify-content:space-between;align-items:center;">' +
            '<span style="font-weight:bold;">Merlin\'s Cloak</span>' +
            '<span id="fjn_close" style="cursor:pointer;padding:0 4px;' +
            'color:' + FUJIN.textSecondary + ';">x</span>' +
            '</div>';

        for (var i = 0; i < SETTING_ROWS.length; i++) {
            var row = SETTING_ROWS[i];
            if (row.key === null) {
                html += '<div style="padding:4px 12px;font-size:11px;' +
                    'color:' + FUJIN.textMuted + ';' +
                    'border-top:1px solid ' + FUJIN.borderDark + ';' +
                    'margin-top:4px;">' + row.label + '</div>';
            } else {
                var on = loadSetting(row.key);
                html += '<div data-fjn-key="' + row.key + '" style="padding:7px 12px;cursor:pointer;' +
                    'border-bottom:1px solid ' + FUJIN.borderDark + ';' +
                    'display:flex;justify-content:space-between;align-items:center;">' +
                    '<span>' + row.label + '</span>' +
                    '<span style="font-size:11px;margin-left:12px;color:' +
                    (on ? FUJIN.ghz24 : FUJIN.textMuted) + ';">' +
                    (on ? '[ON]' : '[OFF]') + '</span>' +
                    '</div>';
            }
        }

        html += '<div id="fjn_reset" style="padding:7px 12px;cursor:pointer;' +
            'text-align:center;color:' + FUJIN.textHint + ';' +
            'border-top:1px solid ' + FUJIN.borderMenu + ';">Reset to defaults</div>';

        panel.innerHTML = html;

        var toggleRows = panel.querySelectorAll('[data-fjn-key]');
        for (var j = 0; j < toggleRows.length; j++) {
            (function (rowEl) {
                rowEl.addEventListener('mouseover', function () { rowEl.style.backgroundColor = FUJIN.navBg; });
                rowEl.addEventListener('mouseout',  function () { rowEl.style.backgroundColor = ''; });
                rowEl.addEventListener('click', function () {
                    var k = rowEl.getAttribute('data-fjn-key');
                    saveSetting(k, !loadSetting(k));
                    location.reload();
                });
            })(toggleRows[j]);
        }

        panel.querySelector('#fjn_close').addEventListener('click', function () {
            panel.style.display = 'none';
        });

        panel.querySelector('#fjn_reset').addEventListener('click', function () {
            var k;
            for (k in SETTINGS_DEFAULTS) {
                if (SETTINGS_DEFAULTS.hasOwnProperty(k)) { saveSetting(k, SETTINGS_DEFAULTS[k]); }
            }
            location.reload();
        });

        document.body.appendChild(panel);
        attachPanelOutsideClick(panel);
    }

    function injectSettingsButton() {
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
        for (var i = 0; i < SETTING_ROWS.length; i++) {
            (function (row) {
                if (row.key === null) { return; }
                var on = loadSetting(row.key);
                GM_registerMenuCommand(
                    (on ? '[ON]  ' : '[OFF] ') + row.label,
                    function () { saveSetting(row.key, !loadSetting(row.key)); location.reload(); }
                );
            })(SETTING_ROWS[i]);
        }
        GM_registerMenuCommand('Reset to defaults', function () {
            var k;
            for (k in SETTINGS_DEFAULTS) {
                if (SETTINGS_DEFAULTS.hasOwnProperty(k)) { saveSetting(k, SETTINGS_DEFAULTS[k]); }
            }
            location.reload();
        });
    }

    // =========================================================
    //  INIT
    // =========================================================

    if (loadSetting('theme'))    { injectFujinStyle(document); }
    if (loadSetting('logoLink')) { makeLogoLink(); }
    hideTitleDown();
    waitForMenu();
    if (loadSetting('routerInfo')) { injectRouterInfoIntoIframe(); }
    registerMenuCommands();

    window.addEventListener('load', function () {
        if (loadSetting('logoLink'))   { makeLogoLink(); }
        hideTitleDown();
        if (loadSetting('routerInfo')) { injectRouterInfoIntoIframe(); }
        hideNetworkMapCards();
        patchGoToPage();
        if (loadSetting('menuReorder')) {
            setTimeout(buildMenu, 500);
            setTimeout(buildMenu, 1500);
        } else {
            setTimeout(hideMenuItems, 500);
        }
        setTimeout(hideNetworkMapCards, 1500);
        setTimeout(hideNetworkMapCards, 3000);
        injectSettingsButton();
    });

})();
