// SERVICE WORKER - GloseMester v2.13.0
const APP_VERSION = 'v2.13.0';
const CACHE_NAME = 'glosemester-v2.13.0';

const ASSETS_TO_CACHE = [
  // ========================================
  // V2.0 ENTRY POINTS
  // ========================================
  './index.html',
  './offline.html',
  './manifest.json',

  // ========================================
  // DESIGN & CSS
  // ========================================
  './src/styles/redesign.css',
  './css/main.css',
  './css/kort.css',
  './css/popups.css',
  './css/glosebank-admin.css',
  './css/glosebank-browse.css',
  './css/standardprover.css',
  './src/styles/landing.css',

  // ========================================
  // V2.0 CORE MODULES
  // ========================================
  './src/app.js',
  './src/core/auth/firebase-config.js',
  './src/core/navigation/router.js',

  // Kort-system v2.0
  './src/core/kort/kort-system.js',
  './src/core/kort/kort-data.js',
  './src/core/kort/kort-reward.js',
  './src/core/kort/kort-display.js',

  // Utilities
  './src/core/utils/feedback.js',
  './src/core/utils/storage.js',
  './src/core/utils/rate-limiter.js',

  // Navigation
  './src/core/navigation/menu-system.js',

  // PWA
  './src/core/pwa/installer.js',
  './src/core/pwa/ios-popup.js',

  // ========================================
  // V2.0 PAGES
  // ========================================
  './src/pages/landing.js',
  './src/pages/fag-start.js',

  // Teacher
  './src/features/teacher/teacher-module.js',

  // ========================================
  // V2.0 FAGMODULER
  // ========================================

  // GloseMester v2.0
  './src/features/glosemester/index.js',
  './src/features/glosemester/glosemester.js',
  './src/features/glosemester/vocabulary-data.js',


  // Base modul
  './src/features/base-modul.js',

  // ========================================
  // V1.0 COMPATIBILITY (gamle index.html)
  // ========================================
  './js/app.js',
  './js/init.js',
  './js/collection.js',
  './js/vocabulary.js',

  // Vendor Libraries
  './js/vendor/jsQR.js',
  './js/vendor/xlsx.full.min.js',

  // Old fagmoduler
  './js/fag/glosemester/vocabulary.js',
  './js/fag/glosemester/practice.js',
  './js/fag/glosemester/kort-data.js',

  // Old shared
  './js/shared/quiz.js',
  './js/shared/kort-system.js',
  './js/data/cardsData.js',

  // Old core
  './js/core/navigation.js',
  './js/core/storage.js',
  './js/core/credits.js',
  './js/core/analytics.js',
  './js/core/logger.js',

  // Rate limiter
  './js/core/rate-limiter.js',

  // Data
  './js/data/norskData.js',

  // Old features
  './js/features/practice.js',
  './js/features/diktat-recorder.js',
  './js/features/quiz.js',
  './js/features/teacher.js',
  './js/features/kort-display.js',
  './js/features/qr-scanner.js',
  './js/features/auth.js',
  './js/features/firebase.js',
  './js/features/saved-tests.js',
  './js/features/glosebank-admin.js',
  './js/features/glosebank-browse.js',
  './js/features/standardprove.js',
  './js/features/gdpr.js',
  './js/features/teacher-analytics.js',
  './js/features/gallery.js',

  // UI Helper
  './js/ui/helpers.js',

  // UI Helpers & Admin
  './js/features/brukeradmin.js',
  './js/features/payment.js'
];

// INSTALL - Cache assets
self.addEventListener('install', (e) => {
  console.log(`[SW] Installerer ${APP_VERSION}`);
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ASSETS_TO_CACHE.map(async url => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) await cache.put(url, res.clone());
      } catch (err) {
        console.warn(`[SW] Kunne ikke cache: ${url}`, err);
      }
    }));
    // Ta over umiddelbart — ingen grunn til å vente siden det ikke finnes update-popup UI
    self.skipWaiting();
  })());
});

// ACTIVATE - Slett gammel cache
self.addEventListener('activate', (e) => {
  console.log(`[SW] Aktiverer ${APP_VERSION}`);
  e.waitUntil((async () => {
    const keys = await caches.keys();
    // Sletter alt som ikke matcher det nye versjonsnavnet
    await Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null));
    await self.clients.claim();
    
    // VARSLE ALLE KLIENTER OM NY VERSJON
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'NEW_VERSION',
        version: APP_VERSION
      });
    });
  })());
});

// MESSAGE - Håndter meldinger fra klienten
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data?.type === 'GET_VERSION') {
    // Send versjon tilbake til klienten
    if (e.ports && e.ports[0]) {
      e.ports[0].postMessage({
        type: 'VERSION_INFO',
        version: APP_VERSION
      });
    } else {
      e.source?.postMessage({ 
        type: 'VERSION_INFO', 
        version: APP_VERSION 
      });
    }
  }
});

// FETCH - Network first for HTML, Cache first for assets
self.addEventListener('fetch', (e) => {
  if (!e.request.url.startsWith('http')) return;
  
  const accept = e.request.headers.get('accept') || '';
  
  // 1. HTML: Prøv nettverk først (alltid fersk), cache som fallback (offline)
  if (accept.includes('text/html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          const c = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, c));
          return res;
        })
        .catch(async () => {
          // Prøv cached versjon først
          const cachedResponse = await caches.match(e.request);
          if (cachedResponse) return cachedResponse;

          // Hvis ikke cached, prøv index.html
          const indexResponse = await caches.match('./index.html');
          if (indexResponse) return indexResponse;

          // Siste fallback: offline.html
          return caches.match('./offline.html');
        })
    );
    return;
  }

  // 2. Bilder, JS, CSS, Lyd: Cache first (raskt), nettverk som fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

console.log(`[SW] ${APP_VERSION} loaded`);