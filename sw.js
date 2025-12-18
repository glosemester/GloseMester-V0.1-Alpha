// ============================================
// SERVICE WORKER - GloseMester v1.0
// Oppdatert: Inkluderer js/ui og nye moduler
// Strategi: Network First (Prøv nett, bruk cache hvis offline)
// ============================================

const CACHE_NAME = 'glosemester-v0.6-beta';;

// Alle filene appen trenger for å virke
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    
    // CSS
    './css/main.css',
    './css/kort.css',
    './css/popups.css',
    
    // JS Rot
    './js/app.js',
    './js/init.js',
    './js/vocabulary.js',
    './js/collection.js',
    // './js/export-import.js', // Kommenter inn hvis du bruker denne
    
    // JS Core
    './js/core/navigation.js',
    './js/core/storage.js',
    './js/core/credits.js',
    './js/core/analytics.js',
    
    // JS Features
    './js/features/practice.js',
    './js/features/quiz.js',
    './js/features/teacher.js',
    './js/features/kort-display.js',
    './js/features/qr-scanner.js',
    
    // JS UI (Denne var ny!)
    './js/ui/helpers.js'
    
    // LYDER (Hvis du har lastet dem opp i en sounds-mappe)
    // './sounds/correct.mp3',
    // './sounds/wrong.mp3',
    // './sounds/win.mp3',
    // './sounds/pop.mp3',
    // './sounds/fanfare.mp3'
];

// 1. INSTALL: Cache alle filer
self.addEventListener('install', (event) => {
    console.log('👷 Service Worker: Installerer...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('👷 Service Worker: Cacher filer');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Tving ny SW til å ta over med en gang
});

// 2. ACTIVATE: Rydd opp i gammel cache
self.addEventListener('activate', (event) => {
    console.log('👷 Service Worker: Aktivert');
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
    // Prøver å hente fra nettet først. Hvis det går, oppdater cachen. 
    // Hvis nettet feiler (offline), bruk cache.
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Sjekk at vi fikk et gyldig svar
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Hvis nettverk feiler, prøv cache
                console.log('🔌 Ingen nett, henter fra cache:', event.request.url);
                return caches.match(event.request);
            })
    );
});