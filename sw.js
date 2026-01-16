// SERVICE WORKER - GloseMester v0.9.83-BETA (Profesjonell)
// Oppdatert: XSS-sikkerhet, WCAG 2.1 accessibility, minnelekkasje-prevensjon
const APP_VERSION = 'v0.9.83-BETA';
const CACHE_NAME = 'glosemester-v0.9.83-beta';

const ASSETS_TO_CACHE = [
  // Hovedfiler
  './index.html',
  './manifest.json',
  
  // Design
  './css/main.css',
  './css/glosebank-admin.css',

  // App Logikk (Root)
  './js/app.js',
  './js/init.js',
  './js/vocabulary.js',
  './js/collection.js',
  
  // VIKTIG: Databasen for kortene (Må med for offline-støtte)
  './js/data/cardsData.js',

  // Core Modules
  './js/core/navigation.js',
  './js/core/storage.js',
  './js/core/credits.js',
  './js/core/analytics.js',

  // Feature Modules
  './js/features/practice.js',
  './js/features/quiz.js',
  './js/features/teacher.js',
  './js/features/kort-display.js',
  './js/features/qr-scanner.js',
  './js/features/auth.js',
  './js/features/firebase.js',
  './js/features/saved-tests.js',
  './js/features/glosebank-admin.js',

  // UI Helper
  './js/ui/helpers.js',

  // Lydeffekter (Slik at lyden virker uten nett)
  './sounds/pop.mp3',
  './sounds/correct.mp3',
  './sounds/wrong.mp3',
  './sounds/win.mp3',
  './sounds/fanfare.mp3'
];

// INSTALL - Cache assets
self.addEventListener('install', (e) => {
  console.log(`[SW] Installerer ${APP_VERSION}`);
  self.skipWaiting(); // Aktiver umiddelbart
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(ASSETS_TO_CACHE.map(async url => {
      try {
        // cache: 'no-store' sikrer at vi henter ferskeste versjon fra server
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) await cache.put(url, res.clone());
      } catch (err) {
        console.warn(`[SW] Kunne ikke cache: ${url}`, err);
      }
    }));
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
        .catch(() => caches.match(e.request) || caches.match('./index.html'))
    );
    return;
  }
  
  // 2. Bilder, JS, CSS, Lyd: Cache first (raskt), nettverk som fallback
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

console.log(`[SW] ${APP_VERSION} loaded`);