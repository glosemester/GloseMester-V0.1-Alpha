/* ============================================
   MENU-SYSTEM.JS - GloseMester v2.6
   Bottom navigation and hamburger menu
   ============================================ */

/**
 * MenuSystem - Manages bottom navigation and hamburger menu
 */
export class MenuSystem {
    constructor() {
        this.currentMenu = null;
        this.activeRole = null;
        this.hamburgerOpen = false;
        this.menuContainer = null;
        this.drawerElement = null;
        this.overlayElement = null;
    }

    /**
     * Initialize menu system
     */
    init() {
        console.log('📱 Initializing MenuSystem...');

        // Create menu container
        this.createMenuContainer();

        // Create hamburger overlay and drawer
        this.createHamburgerElements();

        console.log('✅ MenuSystem initialized');
    }

    /**
     * Create menu container element
     */
    createMenuContainer() {
        // Check if container already exists
        let container = document.getElementById('mester-menu-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mester-menu-container';
            container.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 2000;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        this.menuContainer = container;
    }

    /**
     * Create hamburger drawer and overlay
     */
    createHamburgerElements() {
        // Overlay
        if (!document.getElementById('hamburger-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'hamburger-overlay';
            overlay.className = 'hamburger-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(2px);
                z-index: 3500;
                display: none;
                opacity: 0;
                transition: opacity 0.3s;
            `;
            overlay.addEventListener('click', () => this.closeHamburger());
            document.body.appendChild(overlay);
            this.overlayElement = overlay;
        }

        // Drawer
        if (!document.getElementById('nav-drawer')) {
            const drawer = document.createElement('div');
            drawer.id = 'nav-drawer';
            drawer.className = 'nav-items';
            drawer.style.cssText = `
                position: fixed;
                top: 0;
                left: -100%;
                width: 280px;
                height: 100vh;
                background: white;
                box-shadow: 2px 0 20px rgba(0,0,0,0.2);
                z-index: 4000;
                display: flex;
                flex-direction: column;
                padding: 80px 0 20px 0;
                transition: left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                overflow-y: auto;
            `;
            document.body.appendChild(drawer);
            this.drawerElement = drawer;
        }
    }

    /**
     * Show menu for specific role/context
     * @param {string} type - 'elev', 'oving', 'laerer'
     * @param {Object} options - Menu options
     */
    showMenu(type, options = {}) {
        this.hideMenu();

        this.currentMenu = type;
        this.activeRole = type;

        if (type === 'elev') {
            this.showElevMenu(options);
        } else if (type === 'oving') {
            this.showOvingMenu(options);
        } else if (type === 'laerer') {
            this.showLaererMenu(options);
        }
    }

    /**
     * Show elev menu (bottom nav)
     * @param {Object} options
     */
    showElevMenu(options = {}) {
        const { onHome, onKort, onGalleri, onLogout } = options;

        const nav = document.createElement('nav');
        nav.id = 'elev-meny';
        nav.className = 'bottom-nav elev-nav';
        nav.style.cssText = `
            display: flex;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 8px 12px;
            border-radius: 50px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000;
            align-items: center;
            gap: 10px;
            width: max-content;
            pointer-events: auto;
            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

        nav.innerHTML = `
            <button class="nav-btn" data-action="home">
                🏠 Hjem
            </button>
            <button class="nav-btn" data-action="kort">
                🃏 Mine Kort
            </button>
            <button class="nav-btn" data-action="galleri">
                🏆 Galleri
            </button>
            <button class="nav-btn danger" data-action="logout">
                🚪 Logg ut
            </button>
        `;

        // Add styles
        this.addMenuStyles();

        // Event listeners
        const buttons = nav.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;

                // Remove active from all
                buttons.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');

                // Call handlers
                if (action === 'home' && onHome) onHome();
                else if (action === 'kort' && onKort) onKort();
                else if (action === 'galleri' && onGalleri) onGalleri();
                else if (action === 'logout' && onLogout) onLogout();
            });
        });

        this.menuContainer.appendChild(nav);
    }

    /**
     * Show øving menu (bottom nav)
     * @param {Object} options
     */
    showOvingMenu(options = {}) {
        const { onPractice, onCollection, onGalleri, onQuit } = options;

        const nav = document.createElement('nav');
        nav.id = 'oving-meny';
        nav.className = 'bottom-nav oving-nav';
        nav.style.cssText = `
            display: flex;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 8px 12px;
            border-radius: 50px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2000;
            align-items: center;
            gap: 10px;
            width: max-content;
            pointer-events: auto;
            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

        nav.innerHTML = `
            <button class="nav-btn active" data-action="practice">
                📚 Øv
            </button>
            <button class="nav-btn" data-action="collection">
                🃏 Samling
            </button>
            <button class="nav-btn" data-action="galleri">
                🏆 Galleri
            </button>
            <button class="nav-btn danger" data-action="quit">
                ❌ Avslutt
            </button>
        `;

        // Add styles
        this.addMenuStyles();

        // Event listeners
        const buttons = nav.querySelectorAll('.nav-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;

                // Remove active from all
                buttons.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');

                // Call handlers
                if (action === 'practice' && onPractice) onPractice();
                else if (action === 'collection' && onCollection) onCollection();
                else if (action === 'galleri' && onGalleri) onGalleri();
                else if (action === 'quit' && onQuit) onQuit();
            });
        });

        this.menuContainer.appendChild(nav);
    }

    /**
     * Show lærer menu (hamburger + drawer)
     * @param {Object} options
     */
    showLaererMenu(options = {}) {
        const {
            userName = 'Lærer',
            onDashboard,
            onSavedTests,
            onStandardTests,
            onGlosebank,
            onAdmin,
            onHome,
            onLogout
        } = options;

        // Top nav bar with hamburger
        const nav = document.createElement('nav');
        nav.id = 'laerer-meny';
        nav.className = 'top-nav laerer-nav';
        nav.style.cssText = `
            display: flex;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            padding: 12px 20px;
            border-radius: 0;
            box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 2000;
            align-items: center;
            justify-content: space-between;
            pointer-events: auto;
        `;

        nav.innerHTML = `
            <button class="hamburger-btn" id="hamburger-btn" aria-label="Åpne meny" aria-expanded="false">
                <span class="hamburger-icon">☰</span>
                <span class="hamburger-text">Meny</span>
            </button>

            <span class="user-info">${userName}</span>

            <div class="nav-actions">
                <button class="btn-primary nav-action-btn" id="home-btn">
                    🏠 Hjem
                </button>
            </div>
        `;

        // Add styles
        this.addMenuStyles();

        // Populate drawer
        this.populateDrawer({
            userName,
            onDashboard,
            onSavedTests,
            onStandardTests,
            onGlosebank,
            onAdmin,
            onLogout
        });

        // Event listeners
        const hamburgerBtn = nav.querySelector('#hamburger-btn');
        hamburgerBtn.addEventListener('click', () => this.toggleHamburger());

        const homeBtn = nav.querySelector('#home-btn');
        if (homeBtn && onHome) {
            homeBtn.addEventListener('click', onHome);
        }

        this.menuContainer.appendChild(nav);
    }

    /**
     * Populate hamburger drawer with menu items
     * @param {Object} options
     */
    populateDrawer(options) {
        const {
            userName,
            onDashboard,
            onSavedTests,
            onStandardTests,
            onGlosebank,
            onAdmin,
            onLogout
        } = options;

        this.drawerElement.innerHTML = `
            <div class="drawer-header" style="padding: 0 25px 20px; border-bottom: 1px solid #eee; margin-bottom: 10px;">
                <div style="font-size: 18px; font-weight: 700; color: #1d1d1f; word-break: break-word;">
                    ${userName}
                </div>
            </div>

            <button class="drawer-item active" data-action="dashboard">
                📊 Dashboard
            </button>
            <button class="drawer-item" data-action="saved-tests">
                📝 Lagrede Prøver
            </button>
            <button class="drawer-item" data-action="standard-tests">
                📚 Standardprøver
            </button>
            <button class="drawer-item" data-action="glosebank" style="display: none;">
                📚 GloseBank
            </button>
            <button class="drawer-item" data-action="admin" style="display: none;">
                🔧 Admin
            </button>
            <button class="drawer-item logout" data-action="logout" style="border-top: 2px solid #eee; margin-top: auto; color: #dc2626;">
                🚪 Logg ut
            </button>
        `;

        // Event listeners
        const items = this.drawerElement.querySelectorAll('.drawer-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;

                // Update active state
                items.forEach(i => i.classList.remove('active'));
                if (!item.classList.contains('logout')) {
                    item.classList.add('active');
                }

                // Close drawer
                this.closeHamburger();

                // Call handlers
                if (action === 'dashboard' && onDashboard) onDashboard();
                else if (action === 'saved-tests' && onSavedTests) onSavedTests();
                else if (action === 'standard-tests' && onStandardTests) onStandardTests();
                else if (action === 'glosebank' && onGlosebank) onGlosebank();
                else if (action === 'admin' && onAdmin) onAdmin();
                else if (action === 'logout' && onLogout) onLogout();
            });
        });
    }

    /**
     * Toggle hamburger menu
     */
    toggleHamburger() {
        if (this.hamburgerOpen) {
            this.closeHamburger();
        } else {
            this.openHamburger();
        }
    }

    /**
     * Open hamburger menu
     */
    openHamburger() {
        this.hamburgerOpen = true;
        this.drawerElement.style.left = '0';
        this.overlayElement.style.display = 'block';
        setTimeout(() => {
            this.overlayElement.style.opacity = '1';
        }, 10);

        // Update aria-expanded for accessibility
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.setAttribute('aria-expanded', 'true');
        }
    }

    /**
     * Close hamburger menu
     */
    closeHamburger() {
        this.hamburgerOpen = false;
        this.drawerElement.style.left = '-100%';
        this.overlayElement.style.opacity = '0';
        setTimeout(() => {
            this.overlayElement.style.display = 'none';
        }, 300);

        // Update aria-expanded for accessibility
        const hamburgerBtn = document.getElementById('hamburger-btn');
        if (hamburgerBtn) {
            hamburgerBtn.setAttribute('aria-expanded', 'false');
        }
    }

    /**
     * Hide current menu
     */
    hideMenu() {
        if (this.menuContainer) {
            this.menuContainer.innerHTML = '';
        }
        this.closeHamburger();
        this.currentMenu = null;
    }

    /**
     * Set active menu item
     * @param {string} itemId - ID of menu item
     */
    setActive(itemId) {
        // For bottom nav
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            if (btn.dataset.action === itemId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // For drawer
        const drawerItems = document.querySelectorAll('.drawer-item');
        drawerItems.forEach(item => {
            if (item.dataset.action === itemId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Add menu styles to document
     */
    addMenuStyles() {
        if (document.getElementById('menu-system-styles')) return;

        const style = document.createElement('style');
        style.id = 'menu-system-styles';
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }

            .nav-btn {
                background: transparent;
                border: none;
                padding: 10px 16px;
                font-size: 15px;
                cursor: pointer;
                border-radius: 20px;
                color: #86868b;
                font-weight: 500;
                transition: all 0.2s;
                white-space: nowrap;
            }

            .nav-btn:hover {
                background: rgba(0, 0, 0, 0.05);
            }

            .nav-btn.active {
                background: var(--primary-purple, #7C3AED);
                color: white;
                box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
            }

            .nav-btn.danger {
                color: #dc2626;
            }

            .nav-btn.danger:hover {
                background: rgba(220, 38, 38, 0.1);
            }

            .hamburger-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                background: transparent;
                border: none;
                font-size: 16px;
                font-weight: 600;
                color: #1d1d1f;
                cursor: pointer;
                padding: 8px 12px;
                border-radius: 20px;
                transition: background 0.2s;
            }

            .hamburger-btn:hover {
                background: #f0f0f0;
            }

            .hamburger-icon {
                font-size: 20px;
            }

            .user-info {
                font-size: 13px;
                color: #666;
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 200px;
            }

            .nav-actions {
                display: flex;
                align-items: center;
            }

            .nav-action-btn {
                margin: 0 !important;
                padding: 8px 16px !important;
                font-size: 14px !important;
            }

            .drawer-item {
                width: 100%;
                text-align: left;
                padding: 15px 25px;
                background: transparent;
                border: none;
                font-size: 16px;
                color: #333;
                cursor: pointer;
                border-left: 4px solid transparent;
                transition: all 0.2s;
            }

            .drawer-item:hover {
                background: #f5f5f7;
                border-left-color: var(--primary-purple, #7C3AED);
            }

            .drawer-item.active {
                background: rgba(124, 58, 237, 0.1);
                color: var(--primary-purple, #7C3AED);
                border-left-color: var(--primary-purple, #7C3AED);
                font-weight: 600;
            }

            @media (max-width: 600px) {
                .user-info {
                    display: none;
                }

                .laerer-nav {
                    justify-content: space-between;
                }

                #nav-drawer {
                    width: 85vw !important;
                }

                .bottom-nav {
                    width: 90% !important;
                    padding: 6px 8px !important;
                }

                .nav-btn {
                    padding: 8px 12px !important;
                    font-size: 13px !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Destroy menu system
     */
    destroy() {
        this.hideMenu();

        if (this.menuContainer) {
            this.menuContainer.remove();
        }

        if (this.drawerElement) {
            this.drawerElement.remove();
        }

        if (this.overlayElement) {
            this.overlayElement.remove();
        }

        const styles = document.getElementById('menu-system-styles');
        if (styles) {
            styles.remove();
        }
    }
}

// Export singleton instance
export const menuSystem = new MenuSystem();

// Make globally available
if (typeof window !== 'undefined') {
    window.MenuSystem = MenuSystem;
    window.menuSystem = menuSystem;
}

console.log('📱 MenuSystem module loaded');
