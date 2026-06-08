// ==UserScript==
// @name         Asus RT-BE92U - Merlin UI Customizer
// @namespace    https://github.com/local/asus-merlin-ui
// @version      2.1.4
// @description  Hides unwanted menu items, reorders nav, logo home link, firmware info in status panel
// @author       Heath
// @match        http://192.168.1.1/*
// @match        https://192.168.1.1/*
// @match        http://router.asus.com/*
// @match        https://router.asus.com/*
// @grant        none
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
    //  LOGO -> HOME LINK
    // =========================================================

    function makeLogoLink() {
        var img = document.querySelector('img[src*="asustitle"]');
        if (!img || img.parentElement.tagName === 'A') { return; }

        var anchor = document.createElement('a');
        anchor.href  = 'index.asp';
        anchor.title = 'Home';
        // Preserve the original img alignment by matching its own
        // display and float behavior - do not use inline-block which
        // disrupts the banner float layout
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

        // The original Merlin layout uses a negative margin on the first
        // menu child to overlap the statusBar hero image. We replicate
        // that exactly: apply the margin to the first child only so the
        // parent TD height is unaffected.
        // Original value was -172px on QIS wizard item. Our separator is
        // shorter so we use -160px to land the separator just below banner.
        var firstChild = mainMenu.firstElementChild;
        if (firstChild) {
            firstChild.style.setProperty('margin-top', '-141px', 'important');
        }

        // No z-index or position changes - leave stacking order as-is
        // The original layout relies on natural DOM paint order

        // Stretch the menu div to fill its parent TD so the gray
        // background extends all the way to the footer
        mainMenu.style.setProperty('min-height', '100%', 'important');
    }

    // =========================================================
    //  HIDE TITLEDOWN BAR
    // =========================================================

    function hideTitleDown() {
        var el = document.querySelector('.titledown');
        if (el) { el.style.setProperty('display', 'none', 'important'); }

        // Hide the Merlin logo overlay that sits on top of the menu
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

            // Expand both the iframe and its clipping container to fit content
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

        // Create overlay that fills the content area
        overlay = document.createElement('div');
        overlay.id = 'clientgrid_overlay';
        overlay.style.cssText = [
            'position:relative',
            'background:#1e2a2e',
            'z-index:50',
            'display:block',
            'overflow-y:auto',
            'min-height:700px',
            'font-family:Verdana,Arial,sans-serif',
            'width:100%'
        ].join(';');

        overlay.innerHTML = [
            '<div style="padding:16px;">',
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">',
            '<div style="display:flex;gap:8px;" id="cg_tabs">',
            '<button onclick="window._cgTab(this,\'all\')" style="background:#4D595D;color:#fff;border:0;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">All</button>',
            '<button onclick="window._cgTab(this,\'wired\')" style="background:#2e3c40;color:#ccc;border:0;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">Wired</button>',
            '<button onclick="window._cgTab(this,\'wireless\')" style="background:#2e3c40;color:#ccc;border:0;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px;">Wireless</button>',
            '</div>',
            '<input id="cg_search" onkeyup="window._cgSearch(this.value)" placeholder="Search..." style="background:#2e3c40;color:#fff;border:1px solid #4D595D;padding:6px 10px;border-radius:4px;font-size:12px;width:200px;">',
            '</div>',
            '<div id="cg_grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;"></div>',
            '<div id="cg_loading" style="color:#aaa;text-align:center;padding:40px;">Loading clients...</div>',
            '</div>'
        ].join('');

        // Position relative to content TD
        var contentTd = document.querySelector('td.bgarrow');
        if (contentTd) {
            contentTd.appendChild(overlay);
        }

        // Tab and search handlers
        window._cgAllClients = [];
        window._cgCurrentTab = 'all';

        window._cgTab = function(btn, tab) {
            window._cgCurrentTab = tab;
            var btns = document.querySelectorAll('#cg_tabs button');
            for (var i = 0; i < btns.length; i++) {
                btns[i].style.background = '#2e3c40';
                btns[i].style.color = '#ccc';
            }
            btn.style.background = '#4D595D';
            btn.style.color = '#fff';
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
                if (!c.isOnline) { continue; }
                if (tab === 'wired' && c.isWL !== '0') { continue; }
                if (tab === 'wireless' && c.isWL === '0') { continue; }
                if (q) {
                    var match = (c.nickName || '').toLowerCase().indexOf(q) > -1 ||
                                (c.ip || '').indexOf(q) > -1 ||
                                (c.mac || '').toLowerCase().indexOf(q) > -1 ||
                                (c.vendor || '').toLowerCase().indexOf(q) > -1;
                    if (!match) { continue; }
                }
                filtered.push(c);
            }

            // Sort by IP
            filtered.sort(function(a, b) {
                var aparts = (a.ip || '').split('.').map(Number);
                var bparts = (b.ip || '').split('.').map(Number);
                for (var j = 0; j < 4; j++) {
                    if (aparts[j] !== bparts[j]) { return aparts[j] - bparts[j]; }
                }
                return 0;
            });

            var connLabel = { '0': 'Wired', '1': '2.4G', '2': '5G', '3': '6G' };
            var connColor = { '0': '#4a9eff', '1': '#44cc88', '2': '#ffaa33', '3': '#cc44ff' };

            var html = '';
            for (var k = 0; k < filtered.length; k++) {
                var cl = filtered[k];
                var conn = cl.isWL || '0';
                var label = connLabel[conn] || 'Wired';
                var color = connColor[conn] || '#4a9eff';
                html += '<div style="background:#253035;border-radius:6px;padding:12px;border:1px solid #354045;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">' +
                    '<div style="font-weight:bold;color:#e0e8ec;font-size:13px;word-break:break-word;flex:1;">' + (cl.nickName || cl.name || cl.mac) + '</div>' +
                    '<div style="background:' + color + ';color:#000;font-size:10px;font-weight:bold;padding:2px 6px;border-radius:3px;margin-left:6px;white-space:nowrap;">' + label + '</div>' +
                    '</div>' +
                    '<div style="font-size:12px;color:#a0c8d8;margin-bottom:3px;">' + (cl.ip || '') + '</div>' +
                    '<div style="font-size:10px;color:#9bc;font-family:monospace;">' + (cl.mac || '') + '</div>' +
                    (cl.vendor ? '<div style="font-size:10px;color:#8a9ea8;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + cl.vendor + '">' + cl.vendor + '</div>' : '') +
                    '</div>';
            }

            grid.innerHTML = html || '<div style="color:#567;padding:20px;grid-column:1/-1;">No devices found</div>';
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

        // View List button - hide entire parent cell
        var viewList = document.querySelector('input[value="View List"]');
        if (viewList && viewList.parentElement) {
            viewList.parentElement.style.setProperty('display', 'none', 'important');
        }

        // USB card - hide #status_block which wraps the USB icon
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
        var id;
        for (id in HIDE_IDS) {
            if (HIDE_IDS.hasOwnProperty(id)) {
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

        // Skip rebuild if already done this session
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

        // Anything not in LAYOUT (future firmware additions) appended at end
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
            // Restore hidden content TD children if client list was showing
            var clf = document.getElementById('clientgrid_overlay');
            if (clf) {
                clf.style.setProperty('display', 'none', 'important');
                // Restore statusBar hero image
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
            // Only watch for mainMenu on pages that have it
            // Bail silently on pages like clients.asp that don't
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
                // Inject custom items before buildMenu processes layout
                injectClientListMenuItem();
                buildMenu();
            }
        });

        menuObs.observe(mainMenu, { childList: true, subtree: true });

        if (document.getElementById('index_menu')) {
            menuObs.disconnect();
            injectClientListMenuItem();
            buildMenu();
        }
    }

    // =========================================================
    //  INIT
    // =========================================================

    makeLogoLink();
    hideTitleDown();
    waitForMenu();
    injectRouterInfoIntoIframe();

    window.addEventListener('load', function () {
        makeLogoLink();
        hideTitleDown();
        injectRouterInfoIntoIframe();
        hideNetworkMapCards();
        patchGoToPage();
        setTimeout(buildMenu, 500);
        setTimeout(buildMenu, 1500);
        setTimeout(hideNetworkMapCards, 1500);
        setTimeout(hideNetworkMapCards, 3000);
    });

})();
