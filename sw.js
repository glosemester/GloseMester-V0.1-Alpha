// SERVICE WORKER - GloseMester v0.9.0-BETA (Auto-Update)
const APP_VERSION = 'v0.9.0-BETA';
const CACHE_NAME = 'glosemester-v0.9-beta';
const ASSETS_TO_CACHE = [
  './index.html','./manifest.json',
  './css/main.css','./css/kort.css','./css/popups.css',
  './js/app.js','./js/init.js','./js/vocabulary.js','./js/collection.js',
  './js/core/navigation.js','./js/core/storage.js','./js/core/credits.js','./js/core/analytics.js',
  './js/features/practice.js','./js/features/quiz.js','./js/features/teacher.js','./js/features/kort-display.js','./js/features/qr-scanner.js','./js/features/auth.js','./js/features/firebase.js',
  './js/ui/helpers.js'
];

// INSTALL - Cache assets
self.addEventListener('install',(e)=>{
  console.log(`[SW] Installerer ${APP_VERSION}`);
  self.skipWaiting(); // Aktiver umiddelbart
  e.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(ASSETS_TO_CACHE.map(async url=>{
      try{
        const res=await fetch(url,{cache:'no-store'});
        if(res.ok)await cache.put(url,res.clone());
      }catch{}
    }));
  })());
});

// ACTIVATE - Slett gammel cache
self.addEventListener('activate',(e)=>{
  console.log(`[SW] Aktiverer ${APP_VERSION}`);
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    // Sletter alt som ikke matcher det nye versjonsnavnet
    await Promise.all(keys.map(k=>k!==CACHE_NAME?caches.delete(k):null));
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
self.addEventListener('message',(e)=>{
  if(e.data?.type==='SKIP_WAITING') {
    self.skipWaiting();
  }
  if(e.data?.type==='GET_VERSION'){
    e.source?.postMessage({type:'SW_VERSION',version:APP_VERSION});
  }
});

// FETCH - Network first (alltid siste versjon)
self.addEventListener('fetch',(e)=>{
  if(!e.request.url.startsWith('http'))return;
  const accept=e.request.headers.get('accept')||'';
  
  if(accept.includes('text/html')){
    // HTML: Prøv nettverk først, cache som fallback
    e.respondWith(
      fetch(e.request,{cache:'no-store'})
        .then(res=>{
          const c=res.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(e.request,c));
          return res;
        })
        .catch(()=>caches.match(e.request)||caches.match('./index.html'))
    );
    return;
  }
  
  // Andre filer: Cache first, nettverk som fallback
  e.respondWith(
    caches.match(e.request).then(cached=>cached||fetch(e.request))
  );
});

console.log(`[SW] ${APP_VERSION} loaded`);