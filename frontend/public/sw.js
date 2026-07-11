const CACHE_NAME = 'agency-crm-pwa-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/logo.png',
  '/manifest.json'
];

// Install event: cache static shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('PWA: Failed to cache static assets during install', err);
      });
    })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('agency-crm-')) {
            console.log('PWA: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-First with cache fallback for HTML/navigation and static assets.
// Bypass cache completely for API requests, uploads, non-GET, and non-HTTP/S schemes
// to ensure zero disruption to live CRM functionality and data.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle HTTP and HTTPS requests (ignore chrome-extension:, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Strictly bypass cache for API calls, uploads, or non-GET requests to preserve live CRM functionality
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/uploads') ||
    url.port === '5000'
  ) {
    return;
  }

  // For navigation requests (page reloads) and static assets: Network-First strategy
  // This guarantees users always get the latest deployed frontend code when online,
  // while falling back seamlessly to cached assets when offline.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we get a valid response, clone and update cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (offline), try cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // If navigation request fails offline and not in cache, fallback to /index.html
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) {
            return fallback;
          }
        }
        // Nothing in cache and offline
        return new Response('Offline - Agency CRM is currently unreachable.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
  );
});
