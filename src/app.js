/* ============================================
   MAIN APP ENTRY POINT
   Mester Suite v2.0 - Multi-fag læringsplattform
   ============================================ */

import { router, ROUTES, isProtectedRoute } from './core/navigation/router.js';
import { auth, onAuthStateChanged } from './core/auth/firebase-config.js';
import './core/utils/feedback.js'; // Load feedback utilities globally

/**
 * Global app state
 */
window.MesterSuite = {
    version: '2.0.0-ALPHA',
    aktivtFag: null,
    aktivRolle: null,
    bruker: null,
    moduler: {
        glosemester: null,
        mattemester: null,
        norskmester: null
    },
    initialized: false
};

/**
 * Initialize app
 */
async function initApp() {
    console.log('%c🚀 Mester Suite v2.0 - Initializing...', 'color: #0071e3; font-size: 16px; font-weight: bold;');

    // Setup routes
    setupRoutes();

    // Setup navigation guards
    setupNavigationGuards();

    // Setup auth listener
    onAuthStateChanged(auth, handleAuthChange);

    // Mark as initialized
    window.MesterSuite.initialized = true;

    console.log('%c✅ App initialized successfully', 'color: #10B981; font-size: 14px;');
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

    // ==================== LOGIN ====================
    router.register(ROUTES.LOGIN, async () => {
        // TODO: Import login page when created
        console.log('Login page - TODO');
        showPlaceholder('Login Page (Coming Soon)');
    });

    // ==================== ROLE SELECTOR ====================
    router.register(ROUTES.ROLE_SELECT, async () => {
        // TODO: Import role selector when created
        console.log('Role selector - TODO');
        showPlaceholder('Role Selector (Coming Soon)');
    });

    // ==================== GLOSEMESTER ====================
    router.register(ROUTES.GLOSEMESTER, async () => {
        // Show fag-start (Øv Selv / Prøve / Lærer)
        await import('./pages/fag-start.js');
        window.FagStart.render('gloser');
    });

    // ==================== MATTEMESTER ====================
    router.register(ROUTES.MATTEMESTER, async () => {
        // Show fag-start (Øv Selv / Prøve / Lærer)
        await import('./pages/fag-start.js');
        window.FagStart.render('matte');
    });

    // ==================== NORSKMESTER ====================
    router.register(ROUTES.NORSKMESTER, async () => {
        // Show fag-start (Øv Selv / Prøve / Lærer)
        await import('./pages/fag-start.js');
        window.FagStart.render('norsk');
    });

    // ==================== TEACHER DASHBOARD ====================
    router.register(ROUTES.TEACHER_HOME, async () => {
        // TODO: Import teacher dashboard when refactored
        console.log('Teacher dashboard - TODO');
        showPlaceholder('Teacher Dashboard (Being refactored)');
    });

    // ==================== GALLERY ====================
    router.register(ROUTES.GALLERY, async () => {
        // TODO: Import gallery when created
        console.log('Gallery - TODO');
        showPlaceholder('Card Gallery (Coming Soon)');
    });

    console.log(`✅ ${router.getRoutes().length} routes registered`);
}

/**
 * Setup navigation guards
 */
function setupNavigationGuards() {
    // ==================== BEFORE EACH ====================
    router.beforeEach(async (route) => {
        console.log(`🔍 Before navigation: ${route.path}`);

        // Check authentication for protected routes
        if (isProtectedRoute(route.path) && !auth.currentUser) {
            console.warn('⚠️ Protected route - redirecting to login');
            router.push(ROUTES.LOGIN);
            return false; // Cancel navigation
        }

        return true; // Allow navigation
    });

    // ==================== AFTER EACH ====================
    router.afterEach((route) => {
        console.log(`✅ After navigation: ${route.path}`);

        // Update page title
        document.title = getPageTitle(route.path);

        // Scroll to top
        window.scrollTo(0, 0);
    });
}

/**
 * Handle auth state changes
 */
function handleAuthChange(user) {
    if (user) {
        console.log('✅ User logged in:', user.email);
        window.MesterSuite.bruker = user;

        // Load user data
        loadUserData(user.uid);
    } else {
        console.log('❌ User logged out');
        window.MesterSuite.bruker = null;

        // Only redirect to login if on protected route
        const currentRoute = router.getCurrentRoute();
        if (isProtectedRoute(currentRoute.path)) {
            router.push(ROUTES.LOGIN);
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
 * Get page title for route
 */
function getPageTitle(path) {
    const titles = {
        '/': 'Mester Suite - Hva skal vi øve i dag?',
        '/gloser': 'GloseMester - Lær gloser',
        '/matte': 'MatteMester - Tren matte',
        '/norsk': 'NorskMester - Mestre norsk',
        '/lærer': 'Lærer Dashboard - Mester Suite',
        '/galleri': 'Min Kortsamling',
        '/login': 'Logg inn - Mester Suite'
    };

    return titles[path] || 'Mester Suite';
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
