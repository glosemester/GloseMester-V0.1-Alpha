/* ============================================
   MENU-SYSTEM.JS — GloseMester v3.0
   TabBar (elev/øving) + Sidebar (lærer)
   Stiler: src/styles/menu.css
   ============================================ */

/* ── SVG-ikoner (Lucide-stil, inline) ── */
const ICO_PRACTICE  = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
const ICO_CARDS     = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>`;
const ICO_TROPHY    = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/><rect x="6" y="18" width="12" height="4"/><line x1="12" y1="13" x2="12" y2="18"/></svg>`;
const ICO_USER      = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const ICO_QUIT      = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
const ICO_DASHBOARD = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`;
const ICO_CLIPBOARD = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>`;
const ICO_PLUS      = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`;
const ICO_CHART     = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`;
const ICO_HOME      = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const ICO_LOGOUT    = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const ICO_SWITCH    = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
const ICO_MENU      = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
const ICO_MINSIDE   = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

export class MenuSystem {
    constructor() {
        this.currentMenu = null;
        this.hamburgerOpen = false;
        this.menuContainer = null;
        this.drawerElement = null;
        this.overlayElement = null;
    }

    init() {
        this._ensureContainer();
        this._ensureDrawerElements();
    }

    /** Vis meny for en gitt kontekst */
    showMenu(type, options = {}) {
        this.hideMenu();
        this.currentMenu = type;

        if (type === 'elev')   this.showElevMenu(options);
        else if (type === 'oving')  this.showOvingMenu(options);
        else if (type === 'laerer') this.showLaererMenu(options);
    }

    /* ─── ELEV-MENY ─── */
    showElevMenu(opts = {}) {
        const { onHome, onKort, onGalleri } = opts;

        const tabBar = this._buildTabBar([
            { id: 'home',    icon: ICO_PRACTICE, label: 'Øv',        onClick: onHome },
            { id: 'kort',    icon: ICO_CARDS,    label: 'Mine Kort', onClick: onKort },
            { id: 'galleri', icon: ICO_TROPHY,   label: 'Galleri',   onClick: onGalleri },
        ], 'home');

        this.menuContainer.appendChild(tabBar);
        document.body.classList.add('has-tabbar');
    }

    /* ─── ØVING-MENY ─── */
    showOvingMenu(opts = {}) {
        const { onPractice, onCollection, onGalleri, onQuit } = opts;

        const tabBar = this._buildTabBar([
            { id: 'practice',   icon: ICO_PRACTICE, label: 'Øv',     onClick: onPractice },
            { id: 'collection', icon: ICO_CARDS,    label: 'Samling', onClick: onCollection },
            { id: 'galleri',    icon: ICO_TROPHY,   label: 'Galleri', onClick: onGalleri },
            { id: 'quit',       icon: ICO_QUIT,     label: 'Avslutt', onClick: onQuit, danger: true },
        ], 'practice');

        this.menuContainer.appendChild(tabBar);
        document.body.classList.add('has-tabbar');
    }

    /* ─── LÆRER-MENY ─── */
    showLaererMenu(opts = {}) {
        const { userName = 'Lærer', onDashboard, onMyTests, onCreateTest, onAnalytics, onMinSide, onHome, onLogout } = opts;

        document.body.classList.add('has-sidebar');

        // Topbar (mobil) + tittel på desktop
        const topbar = document.createElement('nav');
        topbar.id = 'teacher-topbar';
        topbar.innerHTML = `
            <button class="t-topbar-hamburger" id="topbar-hamburger" aria-label="Åpne meny" aria-expanded="false">
                ${ICO_MENU} Meny
            </button>
            <span class="t-topbar-logo">GloseMester</span>
            <button class="t-topbar-home" id="topbar-home">
                ${ICO_HOME} Hjem
            </button>
        `;

        topbar.querySelector('#topbar-hamburger').addEventListener('click', () => this.toggleHamburger());
        topbar.querySelector('#topbar-home').addEventListener('click', () => onHome?.());

        this.menuContainer.appendChild(topbar);

        // Sidebar-innhold
        this._populateLaererDrawer({ userName, onDashboard, onMyTests, onCreateTest, onAnalytics, onMinSide, onLogout, onHome });

        // Desktop: sidebar alltid synlig
        if (window.innerWidth >= 1024) {
            setTimeout(() => { this.drawerElement.style.left = '0'; }, 50);
        }
    }

    _populateLaererDrawer({ userName, onDashboard, onMyTests, onCreateTest, onAnalytics, onMinSide, onLogout, onHome }) {
        const initials = (userName || 'L').slice(0, 2).toUpperCase();

        const navItems = [
            { id: 'dashboard',   icon: ICO_DASHBOARD, label: 'Oversikt',    onClick: onDashboard },
            { id: 'my-tests',    icon: ICO_CLIPBOARD, label: 'Mine prøver', onClick: onMyTests },
            { id: 'create-test', icon: ICO_PLUS,      label: 'Lag prøve',   onClick: onCreateTest },
            { id: 'analytics',   icon: ICO_CHART,     label: 'Analyser',    onClick: onAnalytics },
            { id: 'min-side',    icon: ICO_MINSIDE,   label: 'Min side',    onClick: onMinSide },
        ];

        this.drawerElement.innerHTML = `
            <div class="t-sidebar-inner">
                <div class="t-sidebar-logo">
                    <div class="t-sidebar-logo-mark">GloseMester</div>
                    <div class="t-sidebar-logo-sub">Lærerportal</div>
                </div>

                <nav class="t-sidebar-nav" id="sidebar-nav">
                    ${navItems.map(item => `
                        <button class="drawer-item${item.id === 'dashboard' ? ' active' : ''}" data-action="${item.id}">
                            ${item.icon}
                            ${item.label}
                        </button>
                    `).join('')}
                </nav>

                <div class="t-sidebar-footer">
                    <div class="t-sidebar-user">
                        <div class="t-user-avatar">${initials}</div>
                        <div class="t-user-name">${userName}</div>
                    </div>
                    <button class="t-role-switch" id="sidebar-role-switch">
                        ${ICO_SWITCH} Bytt til elevmodus
                    </button>
                    <button class="drawer-item logout" data-action="logout">
                        ${ICO_LOGOUT} Logg ut
                    </button>
                </div>
            </div>
        `;

        // Klikkhandlere
        const items = this.drawerElement.querySelectorAll('.drawer-item:not(.logout)');
        const callbacks = { dashboard: onDashboard, 'my-tests': onMyTests, 'create-test': onCreateTest, analytics: onAnalytics, 'min-side': onMinSide };

        items.forEach(item => {
            item.addEventListener('click', () => {
                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                if (window.innerWidth < 1024) this.closeHamburger();
                callbacks[item.dataset.action]?.();
            });
        });

        this.drawerElement.querySelector('[data-action="logout"]')
            ?.addEventListener('click', () => { if (window.innerWidth < 1024) this.closeHamburger(); onLogout?.(); });

        this.drawerElement.querySelector('#sidebar-role-switch')
            ?.addEventListener('click', () => { if (window.innerWidth < 1024) this.closeHamburger(); onHome?.(); });
    }

    /* ─── BYGG TAB BAR ─── */
    _buildTabBar(tabs, activeId) {
        const existing = document.getElementById('tab-bar');
        if (existing) existing.remove();

        const tabBar = document.createElement('nav');
        tabBar.id = 'tab-bar';
        tabBar.setAttribute('role', 'tablist');

        tabBar.innerHTML = tabs.map(tab => `
            <button
                class="tab-btn${tab.id === activeId ? ' active' : ''}${tab.danger ? ' tab-danger' : ''}"
                data-tab="${tab.id}"
                role="tab"
                aria-selected="${tab.id === activeId}"
                aria-label="${tab.label}"
            >
                ${tab.icon}
                <span class="tab-btn-label">${tab.label}</span>
            </button>
        `).join('');

        tabBar.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tabBar.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-selected', 'false');
                });
                btn.classList.add('active');
                btn.setAttribute('aria-selected', 'true');
                tabs.find(t => t.id === btn.dataset.tab)?.onClick?.();
            });
        });

        return tabBar;
    }

    setActive(itemId) {
        // Tab bar
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.tab === itemId;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        });
        // Sidebar
        document.querySelectorAll('.drawer-item').forEach(item => {
            item.classList.toggle('active', item.dataset.action === itemId);
        });
    }

    setBadge(tabId, count) {
        const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (!btn) return;
        btn.querySelector('.tab-badge')?.remove();
        if (count > 0) {
            const badge = document.createElement('span');
            badge.className = 'tab-badge';
            badge.textContent = count > 99 ? '99+' : String(count);
            btn.appendChild(badge);
        }
    }

    toggleHamburger() {
        this.hamburgerOpen ? this.closeHamburger() : this.openHamburger();
    }

    openHamburger() {
        this.hamburgerOpen = true;
        this.drawerElement.style.left = '0';
        this.overlayElement.style.display = 'block';
        requestAnimationFrame(() => { this.overlayElement.style.opacity = '1'; });
        document.getElementById('topbar-hamburger')?.setAttribute('aria-expanded', 'true');
    }

    closeHamburger() {
        this.hamburgerOpen = false;
        if (window.innerWidth < 1024) this.drawerElement.style.left = '-100%';
        this.overlayElement.style.opacity = '0';
        setTimeout(() => { this.overlayElement.style.display = 'none'; }, 300);
        document.getElementById('topbar-hamburger')?.setAttribute('aria-expanded', 'false');
    }

    hideMenu() {
        document.body.classList.remove('has-sidebar', 'has-tabbar');
        if (this.menuContainer) this.menuContainer.innerHTML = '';
        if (this.drawerElement) {
            this.drawerElement.innerHTML = '';
            this.drawerElement.style.setProperty('left', '-100%', 'important');
        }
        if (this.overlayElement) {
            this.overlayElement.style.opacity = '0';
            this.overlayElement.style.display = 'none';
        }
        document.getElementById('tab-bar')?.remove();
        this.hamburgerOpen = false;
        this.currentMenu = null;
    }

    _ensureContainer() {
        let c = document.getElementById('mester-menu-container');
        if (!c) {
            c = document.createElement('div');
            c.id = 'mester-menu-container';
            c.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:2000;pointer-events:none;';
            document.body.appendChild(c);
        }
        this.menuContainer = c;
    }

    _ensureDrawerElements() {
        // Overlay
        let overlay = document.getElementById('hamburger-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'hamburger-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(2px);z-index:3500;display:none;opacity:0;transition:opacity 0.3s;';
            overlay.addEventListener('click', () => this.closeHamburger());
            document.body.appendChild(overlay);
        }
        this.overlayElement = overlay;

        // Drawer
        let drawer = document.getElementById('nav-drawer');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'nav-drawer';
            drawer.className = 'nav-items';
            drawer.style.cssText = 'position:fixed;top:0;left:-100%;width:var(--sidebar-width,280px);height:100vh;z-index:4000;display:flex;flex-direction:column;transition:left 0.35s cubic-bezier(0.4,0,0.2,1);overflow-y:auto;';
            document.body.appendChild(drawer);
        }
        this.drawerElement = drawer;
    }

    destroy() {
        this.hideMenu();
        this.menuContainer?.remove();
        this.drawerElement?.remove();
        this.overlayElement?.remove();
    }
}

export const menuSystem = new MenuSystem();
window.menuSystem = menuSystem;
window.MenuSystem = MenuSystem;
