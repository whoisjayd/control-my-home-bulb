const CACHE_NAME = 'bulb-control-v2'; // Incremented cache version
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/js/main.js', // FIX: Corrected filename from main.js to app.js
  '/manifest.json',
  '/icons/favicon-32x32.png',
  '/icons/apple-touch-icon.png',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Always bypass for API calls
  if (requestUrl.pathname.startsWith('/api')) {
    // Just fetch, don't try to provide an offline response for API
    return;
  }

  // For other requests, use a Cache First, then Network strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return from cache if found
      if (cachedResponse) {
        return cachedResponse;
      }
      // Otherwise, fetch from network
      return fetch(event.request).catch(() => {
        // If network fails, return the offline page
        return caches.match('/offline.html');
      });
    })
  );
});
