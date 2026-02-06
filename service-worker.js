/* Minimal service worker so PWA registration succeeds and "Add to Home Screen" works. */
const CACHE_NAME = 'slovicka-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  /* Optional: serve from network only; no offline cache for now. */
  event.respondWith(fetch(event.request))
})
