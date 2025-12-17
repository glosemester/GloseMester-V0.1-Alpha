// ============================================
// ANALYTICS.JS - GloseMester v1.0 (Module)
// ============================================

export function trackEvent(category, action, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
        console.log(`📊 Analytics: ${category} > ${action} > ${label}`);
    } else {
        // console.log('⚠️ Analytics ikke aktiv (Dev mode)');
    }
}

export function trackPageView(pageName) {
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'page_title': pageName,
            'page_location': window.location.href,
            'page_path': '/' + pageName
        });
    }
}