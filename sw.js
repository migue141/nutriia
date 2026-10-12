const VERSION='nutriia-v1.0.0';
const ASSETS=['./','./index.html','./manifest.webmanifest','./assets/styles.css','./assets/icon-192.png','./assets/icon-512.png','./js/app.mjs','./js/core.mjs','./js/seed.mjs','./js/store.mjs'];
self.addEventListener('install',e=>e.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('nutriia-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
  e.respondWith(fetch(e.request).then(res=>{if(res.ok){const copy=res.clone();caches.open(VERSION).then(c=>c.put(e.request,copy));}return res;}).catch(()=>caches.match(e.request)));});
