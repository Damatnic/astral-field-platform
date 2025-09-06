// Astral Field Service Worker - Enhanced PWA Version
const CACHE_NAME = 'astral-field-v2.0.0';
const STATIC_CACHE = 'astral-field-static-v2';
const DYNAMIC_CACHE = 'astral-field-dynamic-v2';
const API_CACHE = 'astral-field-api-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/auth/login', 
  '/players',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  // Add critical CSS and JS files
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main-app.js'
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  '/api/players',
  '/api/sync-sportsdata',
  '/api/ai/chat'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 Astral Field SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 SW: Caching static assets');
        // Don't fail installation if some assets fail to cache
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            cache.add(url).catch(err => console.warn(`Failed to cache ${url}:`, err))
          )
        );
      })
      .then(() => {
        console.log('✅ SW: Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ SW: Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Astral Field SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('astral-field-') && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE
            )
            .map(cacheName => {
              console.log('🗑️ SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('✅ SW: Activation complete');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different request types
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Static assets - cache first
    event.respondWith(handleStaticAsset(request));
  } else if (url.pathname.startsWith('/')) {
    // Pages - network first with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📶 SW: Network failed for API request, trying cache...');
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API failures
    return new Response(
      JSON.stringify({ 
        error: 'Offline - this feature requires internet connection',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📶 SW: Failed to fetch static asset:', request.url);
    // Return a basic response for failed static assets
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📶 SW: Network failed for page request, trying cache...');
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to cached home page or offline page
    const fallbackResponse = await caches.match('/') || 
                            await caches.match('/offline.html');
    
    if (fallbackResponse) {
      return fallbackResponse;
    }
    
    // Last resort - return basic offline message
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Astral Field - Offline</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #111827; 
              color: white;
            }
            .logo { font-size: 48px; margin-bottom: 20px; }
            .message { font-size: 18px; margin-bottom: 30px; }
            .retry { 
              background: #3B82F6; 
              color: white; 
              border: none; 
              padding: 12px 24px; 
              border-radius: 6px; 
              cursor: pointer; 
              font-size: 16px;
            }
          </style>
        </head>
        <body>
          <div class="logo">🏈</div>
          <h1>Astral Field</h1>
          <p class="message">You're currently offline. Some features may not be available.</p>
          <button class="retry" onclick="location.reload()">Try Again</button>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle background sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-fantasy-data') {
    event.waitUntil(syncFantasyData());
  }
});

// Sync fantasy data in background
async function syncFantasyData() {
  try {
    console.log('📊 SW: Syncing fantasy data in background...');
    
    const response = await fetch('/api/sync-sportsdata', {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ SW: Fantasy data synced successfully');
    } else {
      console.warn('⚠️ SW: Fantasy data sync failed:', response.status);
    }
  } catch (error) {
    console.error('❌ SW: Background sync error:', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('📱 SW: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Fantasy football update available!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Update',
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Astral Field', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 SW: Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('📨 SW: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('🏈 Astral Field Service Worker loaded successfully!');