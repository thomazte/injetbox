self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open('estoque-v1').then((cache) => cache.addAll(['/', '/manifest.webmanifest'])))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))),
  )
})
