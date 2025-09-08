// Service Worker for Astral Field PWA
const CACHE_NAME = 'astral-field-v1.0.0';
const DYNAMIC_CACHE = 'astral-field-dynamic-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/inter-var.woff2'
];

// API routes to cache
const API_CACHE_ROUTES = [
  '/api/leagues/current',
  '/api/players/search',
  '/api/nfl/teams'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default strategy for other requests
  event.respondWith(staleWhileRevalidate(request));
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    throw error;
  }
}

// Network-first strategy (for API calls)
async function networkFirstStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // Return error response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No cached data available'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Network-first with offline fallback (for HTML pages)
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineCache = await caches.open(CACHE_NAME);
    return offlineCache.match('/offline.html');
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Check if request is for a static asset
function isStaticAsset(pathname) {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.ico'
  ];
  
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-trades') {
    event.waitUntil(syncTrades());
  } else if (event.tag === 'sync-roster') {
    event.waitUntil(syncRosterChanges());
  }
});

// Sync pending trades
async function syncTrades() {
  try {
    const cache = await caches.open('pending-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/trades')) {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync trades failed:', error);
  }
}

// Sync roster changes
async function syncRosterChanges() {
  try {
    const cache = await caches.open('pending-actions');
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/roster')) {
        const cachedResponse = await cache.match(request);
        const data = await cachedResponse.json();
        
        const response = await fetch(request, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync roster failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update from Astral Field',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Astral Field', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      cacheUrls(event.data.urls)
    );
  }
});

// Cache specific URLs on demand
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return cache.addAll(urls);
}