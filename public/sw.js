// Service Worker for caching strategies and offline support

const CACHE_VERSION = '1753396319'; // Increment this version number to force cache refresh
const CACHE_NAME = `fettermans-v${CACHE_VERSION}`;
const STATIC_CACHE = `static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE = `images-v${CACHE_VERSION}`;
const API_CACHE = `api-v${CACHE_VERSION}`;

// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/locations',
  '/api/categories',
  '/api/products'
];

// Install event - cache static assets (production only)
self.addEventListener('install', (event) => {
  console.log(`Service Worker: Installing new version with cache version ${CACHE_VERSION}`);
  
  if (isDevelopment) {
    // Service Worker: Installing in development mode - skipping cache
    event.waitUntil(self.skipWaiting());
    return;
  }
  
  // Service Worker: Installing in production mode
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        // Service Worker: Caching static assets
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Service Worker: Static assets cached
        console.log('Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        // Service Worker: Failed to cache static assets
      })
  );
});

// Listen for the skipWaiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received skip waiting message, activating immediately');
    self.skipWaiting();
  }
});

// Activate event - clean up old caches and force update
self.addEventListener('activate', (event) => {
  // Always log activation in production to help with debugging
  console.log(`Service Worker: Activating new version with cache version ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Always clear old caches when a new service worker activates
            // This ensures users get fresh content after an update
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log(`Service Worker: Deleting old cache ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Now controlling all clients');
        
        // Force all clients to update
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            // Send a message to the client to refresh
            client.postMessage({
              type: 'CACHE_UPDATED',
              version: CACHE_VERSION
            });
          });
          return self.clients.claim();
        });
      })
  );
});

// Fetch event - handle caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // In development mode, skip ALL caching to prevent serving stale content
  if (isDevelopment) {
    return; // Let all requests go through normally without caching in development
  }

  // Always use network-first for HTML and main application files
  // This ensures users always get the latest version of the app shell
  if (request.url.endsWith('.html') || request.url === '/' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the latest version
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // Handle different types of requests with appropriate caching strategies (production only)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isImage(url)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isAPIRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Cache-first strategy (good for static assets)
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Service Worker: Serving from cache
      return cachedResponse;
    }
    
    // Service Worker: Fetching and caching
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Service Worker: Cache-first failed
    return new Response('Offline content not available', { status: 503 });
  }
}

// Network-first strategy (good for API calls)
async function networkFirst(request, cacheName) {
  try {
    // Service Worker: Network-first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Service Worker: Network failed, trying cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content not available offline', { status: 503 });
  }
}

// Stale-while-revalidate strategy (good for dynamic content)
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Service Worker: Background fetch failed
    });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    // Service Worker: Serving stale content
    return cachedResponse;
  }
  
  // If no cache, wait for network
  // Service Worker: No cache, waiting for network
  return fetchPromise;
}

// Helper functions
function isStaticAsset(url) {
  return url.pathname.includes('/static/') || 
         url.pathname.endsWith('.js') || 
         url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.ico');
}

function isImage(url) {
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  // Service Worker: Background sync
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any queued offline actions
    // Service Worker: Performing background sync
    
    // Example: Send queued analytics data
    // const queuedData = await getQueuedData();
    // await sendQueuedData(queuedData);
    
  } catch (error) {
    // Service Worker: Background sync failed
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  // Service Worker: Push received
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Fetterman\'s Restaurant', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  // Service Worker: Notification clicked
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  // Service Worker: Error
});

self.addEventListener('unhandledrejection', (event) => {
  // Service Worker: Unhandled promise rejection
});