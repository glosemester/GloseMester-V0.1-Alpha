// ============================================
// ANALYTICS.JS - GloseMester v0.1-ALPHA
// Google Analytics tracking
// ============================================

/**
 * Track events til Google Analytics
 * @param {string} category - Event kategori (f.eks: "Quiz", "Øving", "Pokemon")
 * @param {string} action - Event handling (f.eks: "Start", "Fullført", "Vunnet")
 * @param {string} label - Event label (f.eks: "5-7 trinn", "Legendary")
 */
function trackEvent(category, action, label) {
    // Sjekk om gtag er tilgjengelig
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
        console.log(`📊 Analytics: ${category} > ${action} > ${label}`);
    } else {
        console.warn('⚠️ Google Analytics ikke tilgjengelig');
    }
}

/**
 * Track side-visninger
 * @param {string} pageTitle - Tittel på siden
 * @param {string} pagePath - Sti til siden
 */
function trackPageView(pageTitle, pagePath) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'page_title': pageTitle,
            'page_path': pagePath
        });
        console.log(`📄 Page view: ${pageTitle} (${pagePath})`);
    }
}

/**
 * Track timing events (f.eks: hvor lang tid bruker bruker)
 * @param {string} category - Kategori
 * @param {string} variable - Variabel navn
 * @param {number} time - Tid i millisekunder
 */
function trackTiming(category, variable, time) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'timing_complete', {
            'name': variable,
            'value': time,
            'event_category': category
        });
        console.log(`⏱️ Timing: ${category} > ${variable} > ${time}ms`);
    }
}

/**
 * Track bruker-egenskaper
 * @param {object} properties - Egenskaper å tracke
 */
function setUserProperties(properties) {
    if (typeof gtag !== 'undefined') {
        gtag('set', 'user_properties', properties);
        console.log('👤 User properties satt:', properties);
    }
}

console.log('📊 analytics.js lastet');