// Service Worker for caching strategies and offline support

const CACHE_NAME = 'fettermans-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const IMAGE_CACHE = 'images-v1';
const API_CACHE = 'api-v1';

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

// Install event - cache static assets
self.addEventListener('install', (event) => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log('Service Worker: Installing...');
  }
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
      console.log('Service Worker: Caching static assets');
    }
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
      console.log('Service Worker: Static assets cached');
    }
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log('Service Worker: Activating...');
  }
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE && 
                cacheName !== API_CACHE) {
              if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
          console.log('Service Worker: Deleting old cache', cacheName);
        }
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
      console.log('Service Worker: Activated');
    }
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests with appropriate caching strategies
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
      if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
          console.log('Service Worker: Serving from cache', request.url);
        }
      return cachedResponse;
    }
    
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
          console.log('Service Worker: Fetching and caching', request.url);
        }
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Cache-first failed', error);
    return new Response('Offline content not available', { status: 503 });
  }
}

// Network-first strategy (good for API calls)
async function networkFirst(request, cacheName) {
  try {
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
        console.log('Service Worker: Network-first for', request.url);
      }
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
          console.log('Service Worker: Network failed, trying cache', request.url);
        }
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
      if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
          console.log('Service Worker: Background fetch failed for', request.url);
        }
    });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
        console.log('Service Worker: Serving stale content', request.url);
      }
    return cachedResponse;
  }
  
  // If no cache, wait for network
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
      console.log('Service Worker: No cache, waiting for network', request.url);
    }
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
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log('Service Worker: Background sync', event.tag);
  }
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Handle any queued offline actions
    if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
      console.log('Service Worker: Performing background sync');
    }
    
    // Example: Send queued analytics data
    // const queuedData = await getQueuedData();
    // await sendQueuedData(queuedData);
    
  } catch (error) {
    console.error('Service Worker: Background sync failed', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log('Service Worker: Push received');
  }
  
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
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    console.log('Service Worker: Notification clicked');
  }
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection', event.reason);
});