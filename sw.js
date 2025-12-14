// ============================================
// SERVICE WORKER - GloseMester v0.1-ALPHA
// ============================================

const CACHE_NAME = 'glose-v0.1-alpha';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/kort.css',
  './css/popups.css'
];

self.addEventListener('install', event => {
  console.log('🚀 Service Worker: Installing...');
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});