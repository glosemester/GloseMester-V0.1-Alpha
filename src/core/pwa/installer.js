/* ============================================
   PWA-INSTALLER.JS - Mester Suite v2.0
   Progressive Web App installation handler
   ============================================ */

/**
 * PWAInstaller - Handles app installation for Android/Chrome and iOS
 */
export class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installBtn = null;
        this.iosPopup = null;
    }

    /**
     * Initialize PWA installer
     */
    init() {
        console.log('📲 Initializing PWA Installer...');

        // Get install button
        this.installBtn = document.getElementById('pwa-install-btn');
        if (!this.installBtn) {
            console.warn('⚠️ PWA install button not found');
            return;
        }

        // Detect iOS
        const isIOS = this.isIOSDevice();
        const isInStandalone = this.isStandaloneMode();

        console.log(`📱 Device: ${isIOS ? 'iOS' : 'Android/Desktop'}`);
        console.log(`📱 Standalone: ${isInStandalone}`);

        // Pre-show button for iOS not in standalone
        if (isIOS && !isInStandalone) {
            this.showInstallButton('Installer på iPhone');
        }

        // Setup event listeners
        this.setupEventListeners(isIOS);

        console.log('✅ PWA Installer initialized');
    }

    /**
     * Setup event listeners
     * @param {boolean} isIOS
     */
    setupEventListeners(isIOS) {
        // Click handler
        this.installBtn.addEventListener('click', () => {
            this.handleInstallClick(isIOS);
        });

        // beforeinstallprompt (Android/Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📲 beforeinstallprompt fired');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton('📲 Installer App');
        });

        // appinstalled (Android/Chrome)
        window.addEventListener('appinstalled', () => {
            console.log('✅ App installed successfully');
            this.hideInstallButton();
            this.deferredPrompt = null;
        });
    }

    /**
     * Handle install button click
     * @param {boolean} isIOS
     */
    async handleInstallClick(isIOS) {
        if (isIOS) {
            // Show iOS instructions
            this.showIOSInstructions();
        } else if (this.deferredPrompt) {
            // Trigger native install prompt (Android/Chrome)
            try {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                console.log(`👤 User choice: ${outcome}`);

                this.deferredPrompt = null;

                if (outcome === 'accepted') {
                    this.hideInstallButton();
                }
            } catch (error) {
                console.error('❌ Install prompt error:', error);
            }
        } else {
            // Fallback for browsers that don't support beforeinstallprompt
            alert('Kunne ikke starte automatisk installasjon. Prøv menyen i nettleseren.');
        }
    }

    /**
     * Show install button
     * @param {string} text - Button text
     */
    showInstallButton(text) {
        if (this.installBtn) {
            this.installBtn.textContent = text;
            this.installBtn.style.display = 'block';
            console.log(`📲 Showing install button: "${text}"`);
        }
    }

    /**
     * Hide install button
     */
    hideInstallButton() {
        if (this.installBtn) {
            this.installBtn.style.display = 'none';
            console.log('🔒 Hiding install button');
        }
    }

    /**
     * Show iOS installation instructions popup
     */
    showIOSInstructions() {
        this.iosPopup = document.getElementById('ios-install-popup');
        if (this.iosPopup) {
            this.iosPopup.style.display = 'flex';
            console.log('🍎 Showing iOS instructions');
        } else {
            console.warn('⚠️ iOS popup not found');
        }
    }

    /**
     * Hide iOS instructions popup
     */
    hideIOSInstructions() {
        if (this.iosPopup) {
            this.iosPopup.style.display = 'none';
            console.log('🍎 Hiding iOS instructions');
        }
    }

    /**
     * Detect if device is iOS
     * @returns {boolean}
     */
    isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * Detect if app is running in standalone mode
     * @returns {boolean}
     */
    isStandaloneMode() {
        return window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true;
    }

    /**
     * Check if PWA is installable
     * @returns {boolean}
     */
    isInstallable() {
        return this.deferredPrompt !== null || this.isIOSDevice();
    }
}

// Export singleton instance
export const pwaInstaller = new PWAInstaller();

// Make globally available
if (typeof window !== 'undefined') {
    window.PWAInstaller = PWAInstaller;
    window.pwaInstaller = pwaInstaller;
}

console.log('📲 PWAInstaller module loaded');
