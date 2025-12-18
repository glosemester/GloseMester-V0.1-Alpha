// ============================================
// SERVICE WORKER - GloseMester
// Strategi:
//  - HTML: Network First (unngå versjonsmiks)
//  - Assets: Cache First
//  - Støtter oppdateringsbanner via GET_VERSION + SKIP_WAITING
// ============================================

const APP_VERSION = 'v0.6 beta';
const CACHE_NAME = `glosemester-${APP_VERSION.replace(/\s+/g, '-').toLowerCase()}`;

const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',

  './css/main.css',
  './css/kort.css',
  './css/popups.css',

  './js/app.js',
  './js/init.js',
  './js/vocabulary.js',
  './js/collection.js',

  './js/core/navigation.js',
  './js/core/storage.js',
  './js/core/credits.js',
  './js/core/analytics.js',

  './js/features/practice.js',
  './js/features/quiz.js',
  './js/features/teacher.js',
  './js/features/kort-display.js',
  './js/features/qr-scanner.js',

  './js/ui/helpers.js',

  // Lyder (disse finnes i repo)
  './sounds/correct.mp3',
  './sounds/wrong.mp3',
  './sounds/win.mp3',
  './sounds/pop.mp3'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(
      ASSETS_TO_CACHE.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok) await cache.put(url, res);
        } catch {
          // Ikke blokkér install pga. enkeltsvikt
        }
      })
    );
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'SW_VERSION', version: APP_VERSION });
    } else if (event.source?.postMessage) {
      event.source.postMessage({ type: 'SW_VERSION', version: APP_VERSION });
    }
    return;
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  const accept = event.request.headers.get('accept') || '';

  // HTML: Network First
  if (accept.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Fonts: Cache First
  if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
    return;
  }

  // Assets: Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
