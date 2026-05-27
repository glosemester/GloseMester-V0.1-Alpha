/* ============================================
   MAIN APP ENTRY POINT
   GloseMester v2.0
   ============================================ */

import { router, ROUTES, isProtectedRoute } from './core/navigation/router.js';
import { auth, onAuthStateChanged } from './core/auth/firebase-config.js';
import { handleFeideCallback } from './core/auth/auth-service.js';
import { visToast } from './core/utils/feedback.js'; // Load feedback utilities globally
import { pwaInstaller } from './core/pwa/installer.js';
import { createIOSPopup } from './core/pwa/ios-popup.js';
import { tradeSystem } from './features/trade/trade-system.js';
import { appHeader } from './core/navigation/app-header.js';

/**
 * Global app state
 */
window.GloseMester = {
    version: '2.6.0',
    aktivtFag: 'gloser',
    aktivRolle: null,
    bruker: null,
    moduler: {
        glosemester: null,
        teacher: null
    },
    initialized: false
};

// For backward compatibility during migration
window.MesterSuite = window.GloseMester;

/**
 * Initialize app
 */
async function initApp() {
    try {
        console.log('%c🚀 GloseMester v2.6.0 - Initializing...', 'color: #7C3AED; font-size: 16px; font-weight: bold;');

        // 0. Handle Feide OAuth callback — Feide sender ?code= til rot-URL etter autentisering
        const feideResult = await handleFeideCallback().catch(err => {
            visToast(err.message, 'error');
            return null;
        });

        // 1. Setup routes FIRST
        setupRoutes();
        setupNavigationGuards();

        // 2. Initialize async features
        onAuthStateChanged(auth, handleAuthChange);
        await initPWA();
        tradeSystem.init();

        // 3. Handle initial route
        const proveKode = new URLSearchParams(window.location.search).get('prove');
        if (proveKode) {
            // QR-kode ble skannet — rydd URL og start prøven direkte
            window.history.replaceState({}, '', window.location.pathname);
            try {
                const { hentProveMedKode, startQuiz } = await import('./shared/quiz/quiz-engine.js');
                const prove = await hentProveMedKode(proveKode.toUpperCase());
                if (prove) {
                    await startQuiz(prove);
                } else {
                    visToast(`Fant ingen prøve med kode "${proveKode}".`, 'error');
                    router.push(ROUTES.LANDING);
                }
            } catch (e) {
                console.error('QR-prøve feil:', e);
                router.push(ROUTES.LANDING);
            }
        } else if (feideResult) {
            router.push(ROUTES.TEACHER_HOME);
        } else {
            router.handleRoute();
        }

        // Mark as initialized
        window.GloseMester.initialized = true;

        console.log('%c✅ GloseMester v2.6.0 - Ready!', 'color: #10B981; font-size: 14px; font-weight: bold;');
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        visToast('Kunne ikke starte appen. Prøv å refresh siden.', 'error');
    }
}

/**
 * Setup all routes
 */
function setupRoutes() {
    console.log('📍 Setting up routes...');

    // ==================== LANDING PAGE ====================
    router.register(ROUTES.LANDING, async () => {
        await import('./pages/landing.js');
        window.Landing.render();
    });

    // ==================== GLOSEMESTER ====================
    router.register(ROUTES.GLOSEMESTER, async () => {
        // Show fag-start (Øv Selv / Prøve / Lærer)
        await import('./pages/fag-start.js');
        window.FagStart.render('gloser');
    });

    // ==================== TEACHER DASHBOARD ====================
    router.register(ROUTES.TEACHER_HOME, async () => {
        const { teacherModule } = await import('./features/teacher/teacher-module.js');
        const { visLoginModal } = await import('./core/auth/auth-service.js');
        window.GloseMester.moduler.teacher = teacherModule;

        let user = auth.currentUser;

        // Ikke innlogget — vis login-modal i stedet for å sende brukeren tilbake
        if (!user) {
            try {
                const result = await visLoginModal();
                user = result.user;
            } catch {
                // Bruker avbrøt innlogging — tilbake til fagvalg
                router.push(ROUTES.GLOSEMESTER);
                return;
            }
        }

        await teacherModule.init({ user });
    });

    // ==================== LOGIN ====================
    router.register(ROUTES.LOGIN, async () => {
        // For nå, redirect til landing da den har login-knapp
        router.push(ROUTES.LANDING);
    });

    // ==================== GALLERY ====================
    router.register(ROUTES.GALLERY, async () => {
        console.log('Gallery - TODO');
        showPlaceholder('Kortgalleriet kommer snart!');
    });

    console.log(`✅ ${router.getRoutes().length} routes registered`);
}

/**
 * Setup navigation guards
 */
function setupNavigationGuards() {
    router.beforeEach(async (route) => {
        // Check authentication for protected routes
        if (isProtectedRoute(route.path) && !auth.currentUser) {
            visToast('Du må logge inn for å se denne siden', 'info');
            router.push(ROUTES.LANDING);
            return false;
        }
        return true;
    });

    router.afterEach((route) => {
        document.title = getPageTitle(route.path);
        window.scrollTo(0, 0);
        _updateAppHeader(route.path);
    });
}

/**
 * Handle auth state changes
 */
function handleAuthChange(user) {
    if (user) {
        console.log('✅ User logged in:', user.email);
        window.GloseMester.bruker = user;
        loadUserData(user.uid);
    } else {
        console.log('❌ User logged out');
        window.GloseMester.bruker = null;
        
        const currentRoute = router.getCurrentRoute();
        if (currentRoute && isProtectedRoute(currentRoute.path)) {
            router.push(ROUTES.LANDING);
        }
    }
}

/**
 * Load user data from Firestore
 */
async function loadUserData(userId) {
    try {
        const { db, doc, getDoc } = await import('./core/auth/firebase-config.js');
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = userSnap.data();
            window.MesterSuite.bruker = {
                ...window.MesterSuite.bruker,
                ...userData
            };
            console.log('✅ User data loaded');
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Oppdater AppHeader basert på rute (kun elev-sider)
 */
function _updateAppHeader(path) {
    const teacherPaths = [ROUTES.TEACHER_HOME, ROUTES.CREATE_TEST, ROUTES.MY_TESTS, ROUTES.ANALYTICS, ROUTES.STANDARD_TESTS, ROUTES.GLOSEBANK];
    const hiddenPaths  = [ROUTES.LANDING, ROUTES.LOGIN, '/'];

    if (hiddenPaths.includes(path) || teacherPaths.some(p => path.startsWith(p))) {
        appHeader.hide();
        return;
    }

    const titles = {
        [ROUTES.GLOSEMESTER]:       { title: 'GloseMester', showBack: false },
        [ROUTES.PRACTICE]:          { title: 'Øv selv',     showBack: true  },
        [ROUTES.QUIZ]:              { title: 'Prøve',       showBack: true  },
        [ROUTES.GALLERY]:           { title: 'Galleri',     showBack: true  },
        [ROUTES.PROFILE]:           { title: 'Min side',    showBack: true  },
    };

    const cfg = titles[path] || { title: 'GloseMester', showBack: true };
    const user = window.GloseMester?.bruker;

    appHeader.show({
        ...cfg,
        role: 'elev',
        onLogout: async () => {
            try {
                const { loggUt } = await import('./core/auth/auth-service.js');
                await loggUt();
            } catch { router.push(ROUTES.LANDING); }
        },
        onSwitchRole: () => router.push(ROUTES.TEACHER_HOME),
    });
}

/**
 * Get page title for route
 */
function getPageTitle(path) {
    const titles = {
        '/': 'GloseMester - Hva skal vi øve i dag?',
        '/gloser': 'GloseMester - Lær gloser',
        '/lærer': 'Lærer Dashboard - GloseMester',
        '/galleri': 'Min Kortsamling',
        '/login': 'Logg inn - GloseMester'
    };

    return titles[path] || 'GloseMester';
}

/**
 * Initialize PWA (Progressive Web App) functionality
 */
async function initPWA() {
    console.log('📲 Initializing PWA...');

    // Register Service Worker
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('✅ Service Worker registered:', registration.scope);

            // Check for updates
            registration.onupdatefound = () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.onstatechange = () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 New version available - reload to update');
                            // Optional: Show update notification
                        }
                    };
                }
            };

            // Listen for Service Worker messages
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'NEW_VERSION') {
                    console.log('🔄 New version detected:', event.data.version);
                }
            });
        } catch (error) {
            console.warn('❌ Service Worker registration failed:', error);
        }
    } else {
        console.warn('⚠️ Service Workers not supported in this browser');
    }

    // Add iOS popup to DOM
    document.body.appendChild(createIOSPopup());

    // Initialize PWA installer (handles install button)
    pwaInstaller.init();

    console.log('✅ PWA initialized');
}

/**
 * Show placeholder for unimplemented pages
 */
function showPlaceholder(message) {
    const container = document.getElementById('app');
    if (!container) return;

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; padding: 40px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 20px;">🚧</div>
            <h2 style="color: #1d1d1f; margin-bottom: 10px;">${message}</h2>
            <p style="color: #666; margin-bottom: 30px;">Vi jobber hardt med å ferdigstille denne siden.</p>
            <button
                onclick="window.router.push('/')"
                style="padding: 12px 24px; background: #0071e3; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                Tilbake til forsiden
            </button>
        </div>
    `;
}

// ==================== INITIALIZE ON LOAD ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Make router globally accessible
window.router = router;
window.ROUTES = ROUTES;
