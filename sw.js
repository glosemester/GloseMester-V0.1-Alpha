// ============================================
// SERVICE WORKER - GloseMester v0.5
// Design: Candy Glass Edition 🍭
// Strategy: Network First
// ============================================

const CACHE_NAME = 'glosemester-v0.52-candy';

// Filer vi MÅ ha for at appen skal virke offline
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    
    // CSS (Oppdatert Design)
    './css/main.css',
    './css/kort.css',
    './css/popups.css',
    
    // Kjerne JavaScript
    './js/app.js',
    './js/init.js',
    './js/vocabulary.js',
    './js/collection.js',
    './js/export-import.js',
    
    // Core Modules (Oppdatert routing)
    './js/core/navigation.js',
    './js/core/storage.js',
    './js/core/credits.js',
    './js/core/analytics.js',
    
    // Features (Gamification & Logic)
    './js/features/practice.js',
    './js/features/quiz.js',
    './js/features/teacher.js',
    './js/features/kort-display.js',
    './js/features/qr-scanner.js',
    './js/ui/helpers.js',
    
    // Bilder
    './header.png',
    './icon.png',

    // 🎵 NYTT: Lydeffekter (Må lastes opp til sounds/-mappen)
    './sounds/correct.mp3',
    './sounds/wrong.mp3',
    './sounds/win.mp3',
    './sounds/pop.mp3'
];

// 1. INSTALL: Cache filer umiddelbart
self.addEventListener('install', (event) => {
    console.log('🍭 Service Worker: Installing Candy Glass Update...');
    self.skipWaiting(); // Tving ny versjon med en gang

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. ACTIVATE: Rydd opp i gamle versjoner (v4, v0.1 osv)
self.addEventListener('activate', (event) => {
    console.log('🍭 Service Worker: Activating & Cleaning...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('🗑️ Sletter gammel cache:', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim();
});

// 3. FETCH: Network First (Hent alltid ferskeste versjon hvis mulig)
self.addEventListener('fetch', (event) => {
    // Ignorer requests som ikke er http (f.eks. chrome-extension)
    if (!event.request.url.startsWith('http')) return;

    // Strategi for Google Fonts (Cache First for ytelse)
    if (event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                return cachedResponse || fetch(event.request);
            })
        );
        return;
    }

    // Strategi for egne filer (Network First)
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                return caches.match(event.request);
            })
    );
});