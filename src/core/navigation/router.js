/* ============================================
   ROUTER - SPA Hash-based routing
   GloseMester v2.0
   ============================================ */

/**
 * Simple hash-based router for SPA navigation
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.beforeHooks = [];
        this.afterHooks = [];

        // Listen to hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        // Note: Initial route handled manually in initApp() to ensure routes are registered first
    }

    /**
     * Register a route
     * @param {string} path - Route path (e.g., '/gloser', '/lærer')
     * @param {Function} handler - Route handler function
     */
    register(path, handler) {
        this.routes.set(path, handler);
        console.log(`📍 Route registered: ${path}`);
    }

    /**
     * Navigate to a route
     * @param {string} path - Target path
     * @param {object} params - Optional query params
     */
    push(path, params = {}) {
        const query = new URLSearchParams(params).toString();
        const fullPath = query ? `${path}?${query}` : path;
        window.location.hash = fullPath;
    }

    /**
     * Replace current route (no history entry)
     * @param {string} path - Target path
     * @param {object} params - Optional query params
     */
    replace(path, params = {}) {
        const query = new URLSearchParams(params).toString();
        const fullPath = query ? `${path}?${query}` : path;
        window.location.replace(`#${fullPath}`);
    }

    /**
     * Get current route info
     */
    getCurrentRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const [path, queryString] = hash.split('?');
        const params = new URLSearchParams(queryString);

        return {
            path,
            params: Object.fromEntries(params.entries()),
            fullHash: hash
        };
    }

    /**
     * Handle route change
     */
    async handleRoute() {
        const route = this.getCurrentRoute();

        console.log(`🧭 Navigating to: ${route.path}`);

        // Run before hooks
        for (const hook of this.beforeHooks) {
            try {
                const result = await hook(route);
                if (result === false) {
                    console.log('⚠️ Navigation cancelled by hook');
                    return; // Cancel navigation
                }
            } catch (error) {
                console.error('Error in beforeHook:', error);
            }
        }

        // Find matching route handler
        const handler = this.routes.get(route.path);

        if (handler) {
            try {
                this.currentRoute = route;
                await handler(route);
            } catch (error) {
                console.error(`Error handling route ${route.path}:`, error);
            }
        } else {
            // 404 - redirect to landing
            console.warn(`Route not found: ${route.path}`);
            this.push('/');
            return;
        }

        // Run after hooks
        for (const hook of this.afterHooks) {
            try {
                await hook(route);
            } catch (error) {
                console.error('Error in afterHook:', error);
            }
        }
    }

    /**
     * Add navigation guard (runs before route change)
     * @param {Function} hook - Hook function
     */
    beforeEach(hook) {
        this.beforeHooks.push(hook);
    }

    /**
     * Add after hook (runs after route change)
     * @param {Function} hook - Hook function
     */
    afterEach(hook) {
        this.afterHooks.push(hook);
    }

    /**
     * Go back in history
     */
    back() {
        window.history.back();
    }

    /**
     * Get all registered routes
     */
    getRoutes() {
        return Array.from(this.routes.keys());
    }
}

// Export singleton instance
export const router = new Router();

// ============================================
// PREDEFINED ROUTES
// ============================================

export const ROUTES = {
    // Main pages
    LANDING: '/',
    LOGIN: '/login',
    ROLE_SELECT: '/velg-rolle',

    // Fag-routes
    GLOSEMESTER: '/gloser',
    GLOSEMESTER_START: '/gloser/start',

    // Elev-routes
    STUDENT_HOME: '/elev',
    PRACTICE: '/ov',
    QUIZ: '/prove',
    GALLERY: '/galleri',

    // Lærer-routes
    TEACHER_HOME: '/lærer',
    CREATE_TEST: '/lærer/lag-prove',
    MY_TESTS: '/lærer/mine-prover',
    ANALYTICS: '/lærer/statistikk',
    STANDARD_TESTS: '/lærer/standardprover',
    GLOSEBANK: '/lærer/glosebank',

    // Felles
    PROFILE: '/min-side',
    SETTINGS: '/innstillinger'
};

// Helper function to check if route is protected
export function isProtectedRoute(path) {
    const protectedRoutes = [
        ROUTES.STUDENT_HOME,
        ROUTES.TEACHER_HOME,
        ROUTES.PRACTICE,
        ROUTES.QUIZ,
        ROUTES.GALLERY,
        ROUTES.CREATE_TEST,
        ROUTES.MY_TESTS,
        ROUTES.ANALYTICS,
        ROUTES.PROFILE
    ];

    return protectedRoutes.includes(path);
}
