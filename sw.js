// DÉBRIEF TECHNIQUE · CÔTE OUEST — sw.js — Version 1.1.1 (lot 1)
// Service worker : garde une copie de l'interface pour qu'elle s'ouvre même avec un réseau faible.
// Pensez à changer VERSION à chaque mise à jour des fichiers.
const VERSION = 'debrief-co-1.1.1';
const SHELL = ['./', './index.html', './styles.css?v=1.1.1', './app.js?v=1.1.1', './config.js', './logo-blanc.png', './icon-192.png', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Réseau d'abord pour les fichiers de l'appli, copie locale en secours. Les appels à l'API ne sont jamais mis en cache.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
