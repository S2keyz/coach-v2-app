const CACHE = 'coach-v2';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/index.html']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).then(r => { const cl = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, cl)); return r; })).catch(() => caches.match('/index.html'))); });
