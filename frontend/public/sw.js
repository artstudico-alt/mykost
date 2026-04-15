const CACHE_NAME = 'mykost-cache-v1';
const API_CACHE_NAME = 'mykost-api-cache-v1';

// Files to cache for offline
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg'
];

// API endpoints to cache
const API_CACHE_URLS = [
  '/api/health',
  '/api/auth/login'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => 
            cacheName !== CACHE_NAME && 
            cacheName !== API_CACHE_NAME
          )
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

// Fetch event - serve from cache first
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Cache API responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE_NAME)
        .then(cache => {
          return cache.match(request)
            .then(response => {
              if (response) {
                console.log('Service Worker: Serving from API cache', request.url);
                return response;
              }
              
              // Fetch from network and cache
              return fetch(request)
                .then(response => {
                  if (response.status === 200) {
                    console.log('Service Worker: Caching API response', request.url);
                    cache.put(request, response.clone());
                  }
                  return response;
                })
                .catch(() => {
                  console.log('Service Worker: Network failed for API', request.url);
                  return new Response('Offline', { 
                    status: 503, 
                    statusText: 'Service Unavailable' 
                  });
                });
            });
        })
    );
    return;
  }
  
  // Serve static files from cache first
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          console.log('Service Worker: Serving from static cache', request.url);
          return response;
        }
        
        // Fetch from network and cache
        return fetch(request)
          .then(response => {
            if (response && response.status === 200) {
              console.log('Service Worker: Caching static file', request.url);
              return caches.open(CACHE_NAME)
                .then(cache => cache.put(request, response.clone()))
                .then(() => response);
            }
            return response;
          })
          .catch(() => {
            return new Response('Offline', { 
              status: 503, 
              statusText: 'Service Unavailable' 
            });
          });
      })
  );
});
