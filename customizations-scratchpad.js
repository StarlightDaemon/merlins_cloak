// =============================================================================
//  MERLIN'S CLOAK — CUSTOMIZATIONS SCRATCHPAD
//  Removed from asus-merlin-ui.user.js at v4.0.0.
//  Theme-only rebase: keeping the Fujin engine clean, setting layout/UI
//  customizations aside for later reference or re-integration.
//
//  Last live version before removal: v3.4.1
//
//  Contents:
//    1. HIDE_IDS (old static hide object, superseded by granular settings keys)
//    2. SETTINGS_DEFAULTS — full settings map (v3.4.1)
//    3. PRESET_THEME_ONLY + applyPreset()
//    4. getHideIds()
//    5. LAYOUT — full menu order definition
//    6. fluidLayout CSS block (was inside buildFujinCSS)
//    7. makeLogoLink()
//    8. fixMenuMargin()
//    9. patchFluidLayout()
//   10. hideTitleDown() — with per-element self-gating
//   11. injectRouterInfoIntoIframe()
//   12. CLIENT LIST GRID — buildClientGrid(), refreshClientGrid(), buildClientListPage()
//   13. injectClientListMenuItem()
//   14. hideNetworkMapCards() — with per-element self-gating
//   15. hideMenuItems()
//   16. buildMenu()
//   17. patchGoToPage()
//   18. waitForMenu()
//   19. SETTING_ROWS — full panel row definitions (v3.4.1)
//   20. buildSettingsPanel() — full version with presets and all rows
//   21. registerMenuCommands() — full version
// =============================================================================


// =============================================================================
//  1. HIDE_IDS (static, pre-settings-system)
// =============================================================================

var HIDE_IDS = {
    'AiProtection_HomeProtection_menu': true,   // AiProtection
    'AiProtection_WebProtector_menu':   true,   // Parental Controls
    'APP_Installation_menu':            true,   // USB Application
    'Advanced_Smart_Home_Alexa_menu':   true,   // Amazon Alexa
    'QIS_wizard_menu':                  true    // Quick Internet Setup
};


// =============================================================================
//  2. SETTINGS_DEFAULTS — full map (v3.4.1)
// =============================================================================

var SETTINGS_DEFAULTS = {
    theme:            true,
    fluidLayout:      true,
    menuReorder:      true,
    clientList:       true,
    routerInfo:       true,
    logoLink:         true,
    // Header chrome hides
    hideTitleDownBar: true,
    hideMerlinLogo:   true,
    // Home page network-map hides
    hideViewListBtn:  true,
    hideUsbCard:      true,
    hideAimeshCount:  true,
    // Menu item hides
    hideAiProtection: true,
    hideParental:     true,
    hideUsb:          true,
    hideAlexa:        true,
    hideQis:          true
};


// =============================================================================
//  3. PRESET_THEME_ONLY + applyPreset()
// =============================================================================

var PRESET_THEME_ONLY = {
    theme:            true,
    fluidLayout:      false,
    menuReorder:      false,
    clientList:       false,
    routerInfo:       false,
    logoLink:         false,
    hideTitleDownBar: false,
    hideMerlinLogo:   false,
    hideViewListBtn:  false,
    hideUsbCard:      false,
    hideAimeshCount:  false,
    hideAiProtection: false,
    hideParental:     false,
    hideUsb:          false,
    hideAlexa:        false,
    hideQis:          false
};

function applyPreset(preset) {
    var k;
    for (k in preset) {
        if (preset.hasOwnProperty(k)) { saveSetting(k, preset[k]); }
    }
    location.reload();
}


// =============================================================================
//  4. getHideIds()
// =============================================================================

function getHideIds() {
    var ids = {};
    if (loadSetting('hideAiProtection')) { ids['AiProtection_HomeProtection_menu'] = true; }
    if (loadSetting('hideParental'))     { ids['AiProtection_WebProtector_menu']   = true; }
    if (loadSetting('hideUsb'))          { ids['APP_Installation_menu']            = true; }
    if (loadSetting('hideAlexa'))        { ids['Advanced_Smart_Home_Alexa_menu']   = true; }
    if (loadSetting('hideQis'))          { ids['QIS_wizard_menu']                  = true; }
    return ids;
}


// =============================================================================
//  5. LAYOUT — full menu order
// =============================================================================

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


// =============================================================================
//  6. fluidLayout CSS block (was inside buildFujinCSS, gated on fluidLayout)
// =============================================================================

// Add this block inside buildFujinCSS() when re-integrating, gated on:
//   if (loadSetting('fluidLayout')) { _p.push( ... ); }

var _FLUID_CSS_BLOCK = [
    /* Outer chrome stretches edge-to-edge */
    'html, body { min-width:0 !important; overflow-x:hidden !important; }',
    '.banner1 { width:100% !important; max-width:none !important; margin:0 !important; box-sizing:border-box !important; }',
    '.statusBar, .minup_bg { width:100% !important; max-width:none !important; margin:0 !important; box-sizing:border-box !important; }',
    /* Main layout table */
    'table.content { width:100% !important; max-width:none !important; table-layout:fixed !important; margin:0 !important; }',
    /* Sidebar menu column keeps a fixed width so it never collapses */
    'table.content > tbody > tr:first-child > td:nth-child(2) { width:200px !important; }',
    'td.bgarrow { width:auto !important; max-width:none !important; min-width:0 !important; }',
    /* Home network map: the diagram + status panel are both fixed-geometry.
       Center them as a group so the unavoidable whitespace is symmetric. */
    '.NM_table { width:100% !important; }',
    '#NM_table_div { width:100% !important; display:flex !important; flex-wrap:wrap !important; justify-content:center !important; align-items:flex-start !important; }',
    '#NM_table_div > div { float:none !important; width:auto !important; flex:0 0 auto !important; box-sizing:border-box !important; }',
    '#statusframe { width:320px !important; box-sizing:border-box !important; }',
    /* Settings pages fill the full width */
    '.FormTable, .FormTitle { width:100% !important; max-width:none !important; box-sizing:border-box !important; }'
];


// =============================================================================
//  7. makeLogoLink()
// =============================================================================

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


// =============================================================================
//  8. fixMenuMargin()
// =============================================================================

function fixMenuMargin() {
    var mainMenu = document.getElementById('mainMenu');
    if (!mainMenu) { return; }
    var firstChild = mainMenu.firstElementChild;
    if (firstChild) {
        firstChild.style.setProperty('margin-top', '-141px', 'important');
    }
    mainMenu.style.setProperty('min-height', '100%', 'important');
}


// =============================================================================
//  9. patchFluidLayout()
//  NOTE: The home network map (_NM_table) is a fixed-geometry diagram
//  (hardcoded cell heights, bgcolor cells, pixel-positioned connector lines).
//  It cannot reflow. Strategy: stretch chrome edge-to-edge, center the diagram
//  group so whitespace is symmetric. The sidebar MUST be explicitly held at
//  200px under table-layout:fixed or it collapses to zero.
//  Requires calling on load + setTimeout x2 to beat late Asus JS.
// =============================================================================

function patchFluidLayout() {
    function sp(el, prop, val) {
        if (el) { el.style.setProperty(prop, val, 'important'); }
    }
    function expand(el) {
        sp(el, 'width',     '100%');
        sp(el, 'max-width', 'none');
        sp(el, 'box-sizing','border-box');
    }

    // Main layout table. align="center" and per-column width attrs are HTML
    // attributes that CSS cannot override -- use removeAttribute() + setProperty.
    var ct = document.querySelector('table.content');
    if (ct) {
        ct.removeAttribute('align');
        expand(ct);
        sp(ct, 'margin', '0');
        sp(ct, 'table-layout', 'fixed');

        // Three columns: [0] spacer, [1] sidebar menu, [2] content (bgarrow).
        // Menu column MUST keep a real width; table-layout:fixed collapses it
        // to zero otherwise (disappearing-sidebar bug).
        var rows = ct.rows;
        if (rows && rows[0]) {
            var cells = rows[0].cells;
            if (cells[0]) { cells[0].removeAttribute('width'); sp(cells[0], 'width', '0'); }
            if (cells[1]) { cells[1].removeAttribute('width'); sp(cells[1], 'width', '200px'); }
            if (cells[2]) { cells[2].removeAttribute('width'); sp(cells[2], 'width', 'auto'); }
        }
    }

    // Banner + status bar stretch edge-to-edge
    var banner = document.querySelector('.banner1');
    expand(banner);
    sp(banner, 'margin', '0');

    var sb = document.querySelector('.statusBar');
    expand(sb);
    sp(sb, 'margin', '0');

    expand(document.querySelector('.minup_bg'));
    expand(document.querySelector('td.bgarrow'));

    // Walk every ancestor of table.content up to body, expanding unknown wrappers.
    if (ct) {
        var el = ct.parentElement;
        while (el && el !== document.body) {
            expand(el);
            sp(el, 'margin-left',  '0');
            sp(el, 'margin-right', '0');
            el = el.parentElement;
        }
    }

    sp(document.body, 'min-width',  '0');
    sp(document.body, 'overflow-x', 'hidden');
    sp(document.documentElement, 'min-width', '0');

    // Network Map: two width:50%;float:left children, both fixed-geometry.
    // Center them as a group so whitespace is symmetric.
    var nmDiv = document.getElementById('NM_table_div');
    if (nmDiv) {
        sp(nmDiv, 'width',           '100%');
        sp(nmDiv, 'display',         'flex');
        sp(nmDiv, 'flex-wrap',       'wrap');
        sp(nmDiv, 'justify-content', 'center');
        sp(nmDiv, 'align-items',     'flex-start');
        var nmChildren = nmDiv.children;
        for (var i = 0; i < nmChildren.length; i++) {
            sp(nmChildren[i], 'float',      'none');
            sp(nmChildren[i], 'width',      'auto');
            sp(nmChildren[i], 'flex',       '0 0 auto');
            sp(nmChildren[i], 'box-sizing', 'border-box');
        }
    }

    // Status frame keeps its natural design width.
    var sf = document.getElementById('statusframe');
    sp(sf, 'width',      '320px');
    sp(sf, 'box-sizing', 'border-box');

    // Settings pages fill the content column.
    var forms = document.querySelectorAll('.FormTable, .FormTitle');
    for (var j = 0; j < forms.length; j++) {
        sp(forms[j], 'width',      '100%');
        sp(forms[j], 'max-width',  'none');
        sp(forms[j], 'box-sizing', 'border-box');
    }
}


// =============================================================================
//  10. hideTitleDown() — per-element self-gating
// =============================================================================

function hideTitleDown() {
    if (loadSetting('hideTitleDownBar')) {
        var el = document.querySelector('.titledown');
        if (el) { el.style.setProperty('display', 'none', 'important'); }
    }
    if (loadSetting('hideMerlinLogo')) {
        var merlinImg = document.querySelector('img[src*="merlin-logo"]');
        if (merlinImg && merlinImg.parentElement) {
            merlinImg.parentElement.style.setProperty('display', 'none', 'important');
        }
    }
}


// =============================================================================
//  11. injectRouterInfoIntoIframe()
//  Injects an op-mode + firmware block into the statusframe as a .unit-block.
//  Also calls injectFujinStyle on the iframe doc on each load.
// =============================================================================

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


// =============================================================================
//  12. CLIENT LIST GRID
//  Reads from /update_clients.asp, renders a full-page card grid with filter
//  tabs (All / Wired / Wireless / Offline), search, and IP-sorted layout.
//  All colors from FUJIN.*, zero border-radius.
// =============================================================================

function buildClientGrid(data) {
    var clients = [];
    try {
        var originData = JSON.parse(data);
        var raw = originData.fromNetworkmapd;
        if (!raw || !raw.length) { return []; }
        for (var i = 0; i < raw.length; i++) {
            var c = raw[i];
            clients.push({
                name:      c.nickName || c.name || c.mac,
                ip:        c.ip       || '',
                mac:       c.mac      || '',
                vendor:    c.vendor   || '',
                iface:     c.isWL === '0' ? 'wired' :
                           c.curTx !== undefined ? 'wireless' : 'wired',
                band:      c.wlBand   || '',
                isOnline:  !!c.isOnline
            });
        }
        clients.sort(function (a, b) {
            var ap = a.ip.split('.').map(Number);
            var bp = b.ip.split('.').map(Number);
            for (var n = 0; n < 4; n++) {
                if (ap[n] !== bp[n]) { return ap[n] - bp[n]; }
            }
            return 0;
        });
    } catch (ex) { return []; }
    return clients;
}

function refreshClientGrid() {
    var overlay = document.getElementById('clientgrid_overlay');
    if (!overlay) { return; }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/update_clients.asp', true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4 || xhr.status !== 200) { return; }
        var script = document.createElement('script');
        script.text = xhr.responseText;
        document.head.appendChild(script);
        if (document.head.contains(script)) { document.head.removeChild(script); }
        if (typeof originData !== 'undefined') {
            buildClientListPage(JSON.stringify(originData));
        }
    };
    xhr.send();
}

window.refreshClientGrid = refreshClientGrid;

function buildClientListPage(data) {
    var clients = buildClientGrid(data);
    var overlay = document.getElementById('clientgrid_overlay');
    if (!overlay) { return; }

    var activeTab = overlay._activeTab || 'all';
    var searchVal = (overlay._search || '').toLowerCase();

    function connectionLabel(c) {
        if (!c.isOnline)            { return ''; }
        if (c.iface === 'wired')    { return 'Wired'; }
        if (c.band === '2.4G')      { return '2.4G'; }
        if (c.band === '5G')        { return '5G'; }
        if (c.band === '6G')        { return '6G'; }
        return 'Wi-Fi';
    }

    function connectionColor(c) {
        if (!c.isOnline)            { return FUJIN.textMuted; }
        if (c.iface === 'wired')    { return FUJIN.wired; }
        if (c.band === '2.4G')      { return FUJIN.ghz24; }
        if (c.band === '5G')        { return FUJIN.ghz5; }
        if (c.band === '6G')        { return FUJIN.ghz6; }
        return FUJIN.textSecondary;
    }

    var filtered = clients.filter(function (c) {
        if (activeTab === 'wired'    && (c.iface !== 'wired'    || !c.isOnline)) { return false; }
        if (activeTab === 'wireless' && (c.iface !== 'wireless' || !c.isOnline)) { return false; }
        if (activeTab === 'offline'  && c.isOnline)                              { return false; }
        if (activeTab === 'all'      && !c.isOnline)                             { return false; }
        if (searchVal) {
            var hay = (c.name + c.ip + c.mac + c.vendor).toLowerCase();
            if (hay.indexOf(searchVal) === -1) { return false; }
        }
        return true;
    });

    var tabs = [
        { id: 'all',      label: 'All Online' },
        { id: 'wired',    label: 'Wired' },
        { id: 'wireless', label: 'Wireless' },
        { id: 'offline',  label: 'Offline' }
    ];

    var tabHtml = tabs.map(function (t) {
        var active = t.id === activeTab;
        return '<span data-tab="' + t.id + '" style="' +
            'padding:4px 14px;cursor:pointer;font-size:12px;' +
            'background:' + (active ? FUJIN.contentBg : FUJIN.bgTitle) + ';' +
            'color:' + (active ? FUJIN.textPrimary : FUJIN.textSecondary) + ';' +
            'border:1px solid ' + FUJIN.borderMenu + ';margin-right:4px;">' +
            t.label + '</span>';
    }).join('');

    var cardHtml = filtered.map(function (c) {
        var color  = connectionColor(c);
        var label  = connectionLabel(c);
        var opacity = c.isOnline ? '1' : '0.45';
        return '<div style="background:' + FUJIN.bgStatus + ';border:1px solid ' + FUJIN.borderCard + ';' +
            'padding:10px 14px;min-width:200px;flex:1 1 220px;box-sizing:border-box;opacity:' + opacity + ';">' +
            '<div style="font-weight:bold;color:' + FUJIN.textPrimary + ';margin-bottom:4px;">' + c.name + '</div>' +
            '<div style="font-size:11px;color:' + FUJIN.textSecondary + ';">' + c.ip + '</div>' +
            '<div style="font-size:11px;color:' + FUJIN.textMuted + ';">' + c.mac + '</div>' +
            '<div style="font-size:11px;color:' + FUJIN.textMuted + ';">' + c.vendor + '</div>' +
            (label ? '<div style="display:inline-block;margin-top:6px;background:' + color + ';color:#000;font-size:10px;font-weight:bold;padding:2px 6px;margin-left:6px;white-space:nowrap;">' + label + '</div>' : '') +
            '</div>';
    }).join('');

    var existSearch = overlay.querySelector('#fjn_grid_search');
    var searchCurrent = existSearch ? existSearch.value : '';

    overlay.innerHTML =
        '<div style="background:' + FUJIN.bgDark + ';padding:10px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
        '<span style="font-weight:bold;font-size:14px;color:' + FUJIN.textPrimary + ';">Client List</span>' +
        '<div>' + tabHtml + '</div>' +
        '<input id="fjn_grid_search" placeholder="Search..." value="' + searchCurrent + '" style="' +
        'background:' + FUJIN.inputBg + ';border:1px solid ' + FUJIN.borderInput + ';' +
        'color:' + FUJIN.textPrimary + ';padding:4px 8px;font-size:12px;flex:1;min-width:140px;">' +
        '<span id="fjn_grid_refresh" style="cursor:pointer;padding:4px 10px;font-size:12px;' +
        'background:' + FUJIN.bgTitle + ';border:1px solid ' + FUJIN.borderMenu + ';' +
        'color:' + FUJIN.textSecondary + ';">Refresh</span>' +
        '</div>' +
        '<div style="padding:12px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:flex-start;">' +
        cardHtml +
        '</div>';

    overlay._activeTab = activeTab;
    overlay._search    = searchCurrent;

    overlay.querySelectorAll('[data-tab]').forEach(function (el) {
        el.addEventListener('click', function () {
            overlay._activeTab = el.getAttribute('data-tab');
            buildClientListPage(data);
        });
    });

    var searchEl = overlay.querySelector('#fjn_grid_search');
    if (searchEl) {
        searchEl.addEventListener('input', function () {
            overlay._search = searchEl.value;
            buildClientListPage(data);
        });
        if (!existSearch) { searchEl.focus(); }
    }

    var refreshEl = overlay.querySelector('#fjn_grid_refresh');
    if (refreshEl) {
        refreshEl.addEventListener('click', function () { refreshClientGrid(); });
    }
}


// =============================================================================
//  13. injectClientListMenuItem()
// =============================================================================

function injectClientListMenuItem() {
    if (document.getElementById('client_list_menu')) { return; }

    var nmItem = document.getElementById('index_menu');
    if (!nmItem || !nmItem.parentElement) { return; }

    var li = document.createElement('div');
    li.id = 'client_list_menu';
    li.className = nmItem.className;
    li.innerHTML = '<a href="#" onclick="return false;" style="text-decoration:none;">' +
        '<div class="menu" style="cursor:pointer;">Client List</div>' +
        '</a>';

    nmItem.parentElement.insertBefore(li, nmItem.nextSibling);

    li.addEventListener('click', function () {
        var contentTd = document.querySelector('td.bgarrow');
        if (!contentTd) { return; }

        var statusBar = document.querySelector('.statusBar');
        if (statusBar) { statusBar.style.setProperty('display', 'none', 'important'); }

        var children = contentTd.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i].id !== 'clientgrid_overlay') {
                children[i].style.setProperty('display', 'none', 'important');
            }
        }

        var overlay = document.getElementById('clientgrid_overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'clientgrid_overlay';
            overlay.style.cssText = 'width:100%;min-height:100%;background:' + FUJIN.bgPage + ';';
            contentTd.appendChild(overlay);
        }
        overlay.style.removeProperty('display');

        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/update_clients.asp', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4 || xhr.status !== 200) { return; }
            var script = document.createElement('script');
            script.text = xhr.responseText;
            document.head.appendChild(script);
            if (document.head.contains(script)) { document.head.removeChild(script); }
            if (typeof originData !== 'undefined') {
                buildClientListPage(JSON.stringify(originData));
            }
        };
        xhr.send();
    });
}


// =============================================================================
//  14. hideNetworkMapCards() — per-element self-gating
// =============================================================================

function hideNetworkMapCards() {
    var isIndex = window.location.pathname.indexOf('index.asp') > -1 ||
                  window.location.pathname === '/';
    if (!isIndex) { return; }

    if (loadSetting('hideViewListBtn')) {
        var viewList = document.querySelector('input[value="View List"]');
        if (viewList && viewList.parentElement) {
            viewList.parentElement.style.setProperty('display', 'none', 'important');
        }
    }

    if (loadSetting('hideUsbCard')) {
        var usbStatus = document.getElementById('usb_status');
        if (usbStatus && usbStatus.parentElement) {
            usbStatus.parentElement.style.setProperty('display', 'none', 'important');
        }
    }

    if (loadSetting('hideAimeshCount')) {
        var aimeshNodes = document.querySelectorAll('.aimesh_node, #aimesh_node_status, [id*="aimesh_num"]');
        for (var ai = 0; ai < aimeshNodes.length; ai++) {
            aimeshNodes[ai].style.setProperty('display', 'none', 'important');
        }
    }
}


// =============================================================================
//  15. hideMenuItems()
// =============================================================================

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


// =============================================================================
//  16. buildMenu()
//  Rebuilds the sidebar using the LAYOUT array. Injects custom separator labels.
// =============================================================================

function buildMenu() {
    var mainMenu = document.getElementById('mainMenu');
    if (!mainMenu) { return; }

    var hideIds = getHideIds();
    var fragment = document.createDocumentFragment();
    var existingItems = {};

    var allItems = mainMenu.querySelectorAll('[id]');
    for (var k = 0; k < allItems.length; k++) {
        existingItems[allItems[k].id] = allItems[k];
    }

    for (var i = 0; i < LAYOUT.length; i++) {
        var entry = LAYOUT[i];

        if (entry.type === 'SEPARATOR') {
            var sep = document.createElement('div');
            sep.className = 'menu_Split';
            sep.textContent = entry.label;
            sep.style.cssText = 'padding:4px 8px;font-size:11px;font-weight:bold;' +
                'color:' + FUJIN.textSecondary + ';' +
                'background:' + FUJIN.blockBg + ';' +
                'border-top:1px solid ' + FUJIN.borderMenu + ';' +
                'border-bottom:1px solid ' + FUJIN.borderMenu + ';' +
                'letter-spacing:0.5px;';
            fragment.appendChild(sep);
        } else if (entry.type === 'MENU') {
            if (hideIds[entry.id]) { continue; }
            var item = existingItems[entry.id];
            if (item) {
                fragment.appendChild(item);
            }
        }
    }

    while (mainMenu.firstChild) { mainMenu.removeChild(mainMenu.firstChild); }
    mainMenu.appendChild(fragment);
    fixMenuMargin();
}


// =============================================================================
//  17. patchGoToPage()
//  Monkey-patches the router's goToPage() to hide the client grid overlay when
//  navigating away via the normal menu. Gated on clientList setting.
// =============================================================================

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


// =============================================================================
//  18. waitForMenu()
//  Observes #mainMenu until the router's own JS populates it, then fires
//  injectClientListMenuItem and/or buildMenu.
// =============================================================================

function waitForMenu() {
    var mainMenu = document.getElementById('mainMenu');
    if (!mainMenu) { return; }

    var menuObs = new MutationObserver(function () {
        if (!document.getElementById('index_menu')) { return; }
        menuObs.disconnect();
        if (loadSetting('clientList')) { injectClientListMenuItem(); }
        if (loadSetting('menuReorder')) { buildMenu(); } else { hideMenuItems(); }
    });

    menuObs.observe(mainMenu, { childList: true, subtree: true });

    if (document.getElementById('index_menu')) {
        menuObs.disconnect();
        if (loadSetting('clientList')) { injectClientListMenuItem(); }
        if (loadSetting('menuReorder')) { buildMenu(); } else { hideMenuItems(); }
    }
}


// =============================================================================
//  19. SETTING_ROWS — full panel row definitions (v3.4.1)
// =============================================================================

var SETTING_ROWS = [
    { key: 'theme',            label: 'Fujin Theme' },
    { key: 'fluidLayout',      label: 'Fluid Layout' },
    { key: 'menuReorder',      label: 'Menu Reorder' },
    { key: 'clientList',       label: 'Client List Item' },
    { key: 'routerInfo',       label: 'Router Info Panel' },
    { key: 'logoLink',         label: 'Logo Home Link' },
    { key: null,               label: 'Hide: Header' },
    { key: 'hideTitleDownBar', label: 'Titledown Bar' },
    { key: 'hideMerlinLogo',   label: 'Merlin Logo' },
    { key: null,               label: 'Hide: Home Page' },
    { key: 'hideViewListBtn',  label: 'View List Button' },
    { key: 'hideUsbCard',      label: 'USB Card' },
    { key: 'hideAimeshCount',  label: 'AiMesh Node Count' },
    { key: null,               label: 'Hide: Menu Items' },
    { key: 'hideAiProtection', label: 'AiProtection' },
    { key: 'hideParental',     label: 'Parental Controls' },
    { key: 'hideUsb',          label: 'USB Application' },
    { key: 'hideAlexa',        label: 'Amazon Alexa' },
    { key: 'hideQis',          label: 'Quick Internet Setup' }
];


// =============================================================================
//  20. buildSettingsPanel() — full version with presets and all rows
// =============================================================================

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

    html += '<div style="padding:4px 12px;font-size:11px;' +
        'color:' + FUJIN.textMuted + ';' +
        'border-top:1px solid ' + FUJIN.borderMenu + ';margin-top:4px;">Presets</div>';
    html += '<div id="fjn_preset_theme" style="padding:7px 12px;cursor:pointer;' +
        'border-bottom:1px solid ' + FUJIN.borderDark + ';' +
        'color:' + FUJIN.textLink + ';">Theme only (stock layout)</div>';
    html += '<div id="fjn_preset_full" style="padding:7px 12px;cursor:pointer;' +
        'border-bottom:1px solid ' + FUJIN.borderDark + ';' +
        'color:' + FUJIN.textLink + ';">Full customization</div>';

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

    var presetTheme = panel.querySelector('#fjn_preset_theme');
    presetTheme.addEventListener('mouseover', function () { presetTheme.style.backgroundColor = FUJIN.navBg; });
    presetTheme.addEventListener('mouseout',  function () { presetTheme.style.backgroundColor = ''; });
    presetTheme.addEventListener('click', function () { applyPreset(PRESET_THEME_ONLY); });

    var presetFull = panel.querySelector('#fjn_preset_full');
    presetFull.addEventListener('mouseover', function () { presetFull.style.backgroundColor = FUJIN.navBg; });
    presetFull.addEventListener('mouseout',  function () { presetFull.style.backgroundColor = ''; });
    presetFull.addEventListener('click', function () { applyPreset(SETTINGS_DEFAULTS); });

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


// =============================================================================
//  21. registerMenuCommands() — full version
// =============================================================================

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
