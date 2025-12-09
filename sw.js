// Service Worker for OIM Assistant PWA
// Version 1.1 - Fixed paths for GitHub Pages

const CACHE_NAME = 'oim-assist-v1';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './handwriting.js',
  './pwa.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
  'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => {
          if (url.startsWith('http')) {
            return new Request(url, {cache: 'reload'});
          }
          return new Request(url, {cache: 'reload'});
        }));
      })
      .catch(err => {
        console.log('Cache install error:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip cross-origin requests except allowed CDNs
  const url = new URL(event.request.url);
  const allowedOrigins = [
    'cdnjs.cloudflare.com',
    'cdn.jsdelivr.net'
  ];
  
  const isAllowedOrigin = allowedOrigins.some(origin => url.hostname.includes(origin));
  const isSameOrigin = url.origin === self.location.origin;
  
  if (!isSameOrigin && !isAllowedOrigin) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the new response
          caches.open(CACHE_NAME)
            .then(cache => {
              // Only cache GET requests
              if (event.request.method === 'GET') {
                cache.put(event.request, responseToCache);
              }
            });

          return response;
        }).catch(error => {
          console.log('Fetch failed:', error);
          // Return offline page if available
          return caches.match('./index.html');
        });
      })
  );
});

// Background sync for future features
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

async function syncReports() {
  // Placeholder for future background sync functionality
  console.log('Background sync triggered');
}

// Push notification support for future
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: './icons/icon-192.png',
    badge: './icons/icon-180.png',
    vibrate: [200, 100, 200],
    tag: 'oim-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('OIM Assistant', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./')
  );
});