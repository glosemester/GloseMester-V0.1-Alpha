/* ============================================
   LOGGER.JS - Environment-aware logging
   Production-ready logging system
   ============================================ */

// Detect production environment
const IS_PRODUCTION = window.location.hostname !== 'localhost'
    && window.location.hostname !== '127.0.0.1'
    && !window.location.hostname.includes('localhost');

/**
 * Production-safe logger
 * - Blocks console.log in production
 * - Allows console.error and console.warn always
 */
export const logger = {
    /**
     * Log general messages (disabled in production)
     */
    log: (...args) => {
        if (!IS_PRODUCTION) {
            console.log(...args);
        }
    },

    /**
     * Log errors (always enabled)
     */
    error: (...args) => {
        console.error(...args);
    },

    /**
     * Log warnings (always enabled)
     */
    warn: (...args) => {
        console.warn(...args);
    },

    /**
     * Log info messages (disabled in production)
     */
    info: (...args) => {
        if (!IS_PRODUCTION) {
            console.info(...args);
        }
    },

    /**
     * Log debug messages (disabled in production)
     */
    debug: (...args) => {
        if (!IS_PRODUCTION) {
            console.debug(...args);
        }
    }
};

/**
 * Override global console.log in production to prevent leaks
 */
export function disableConsoleInProduction() {
    if (IS_PRODUCTION) {
        const noop = () => {};
        console.log = noop;
        console.info = noop;
        console.debug = noop;
        // Keep console.error and console.warn for critical issues
    }
}

/**
 * Setup global error boundary
 * Catches unhandled errors and shows user-friendly message
 */
export function setupGlobalErrorHandler() {
    // Handle runtime errors
    window.addEventListener('error', (event) => {
        console.error('❌ Global error caught:', event.error);

        // Show user-friendly message
        showErrorToUser('Det oppstod en uventet feil. Prøv å laste siden på nytt.');

        // TODO: Send to error tracking service (e.g., Sentry)
        // sendToErrorTracking(event.error);

        // Prevent default browser error handling
        event.preventDefault();
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ Unhandled promise rejection:', event.reason);

        // Show user-friendly message
        showErrorToUser('Kunne ikke fullføre handlingen. Prøv igjen.');

        // TODO: Send to error tracking service
        // sendToErrorTracking(event.reason);

        // Prevent default browser error handling
        event.preventDefault();
    });

    logger.info('✅ Global error handler aktivert');
}

/**
 * Show error message to user
 * Uses toast if available, otherwise alert
 */
function showErrorToUser(message) {
    // Try to use toast system if available
    if (window.visToast && typeof window.visToast === 'function') {
        window.visToast(message, 'error');
    } else {
        // Fallback to alert if toast not available
        alert(message);
    }
}
