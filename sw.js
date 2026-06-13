// Down on the Deck — service worker (offline + installable)
const CACHE = 'dotd-v1';
const ASSETS = [
  './', './index.html', './manifest.json',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // HTML: network-first so updates show when online, cache fallback when offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { caches.open(CACHE).then(c => c.put('./index.html', r.clone())).catch(() => {}); return r; })
        .catch(() => caches.match('./index.html').then(c => c || caches.match('./')))
    );
    return;
  }
  // Other assets: cache-first
  e.respondWith(caches.match(req).then(c => c || fetch(req)));
});
