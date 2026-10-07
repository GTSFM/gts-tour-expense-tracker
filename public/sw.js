// GTS Tour Expense Tracker Service Worker
const CACHE_NAME = 'gts-claims-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle API and uploads requests directly
  if (event.request.url.includes('/api/') || event.request.url.includes('/uploads/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
