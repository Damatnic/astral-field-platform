/**
 * Advanced Service Worker for Astral Field PWA
 * Provides comprehensive offline functionality, caching strategies, and push notifications
 */

const CACHE_VERSION = '2.0.0';
const CACHE_PREFIX = 'astral-field';
const STATIC_CACHE_NAME = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`;
const API_CACHE_NAME = `${CACHE_PREFIX}-api-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `${CACHE_PREFIX}-images-${CACHE_VERSION}`;
const FONT_CACHE_NAME = `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`;

// Core files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/dashboard',
  '/leagues',
  '/live',
  '/waivers',
  '/settings',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache with different strategies
const CACHEABLE_APIS = {
  staleWhileRevalidate: [
    '/api/leagues/current',
    '/api/health/comprehensive',
    '/api/live/scores',
    '/api/leagues/[id]/roster',
    '/api/leagues/[id]/standings'
  ],
  networkFirst: [
    '/api/leagues/[id]/matchup',
    '/api/live/scores',
    '/api/chat/messages'
  ],
  cacheFirst: [
    '/api/leagues/[id]/schedule',
    '/api/players/stats',
    '/api/draft/rankings'
  ]
};

// Cache configurations
const CACHE_CONFIG = {
  maxAge: {
    static: 7 * 24 * 60 * 60 * 1000, // 7 days
    api: 5 * 60 * 1000, // 5 minutes
    images: 30 * 24 * 60 * 60 * 1000, // 30 days
    fonts: 365 * 24 * 60 * 60 * 1000 // 1 year
  },
  maxEntries: {
    api: 50,
    images: 100,
    dynamic: 150
  }
};

// IndexedDB configuration
const DB_NAME = 'AstralFieldOfflineDB';
const DB_VERSION = 2;

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
      // Enable navigation preload if supported
      self.registration.navigationPreload?.enable?.()
    ])
    .then(() => {
      console.log('✅ Service Worker installed successfully');
      return self.skipWaiting();
    })
    .catch((error) => {
      console.error('❌ Service Worker installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...', CACHE_VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        const currentCaches = [
          STATIC_CACHE_NAME,
          DYNAMIC_CACHE_NAME,
          API_CACHE_NAME,
          IMAGE_CACHE_NAME,
          FONT_CACHE_NAME
        ];
        
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName.startsWith(CACHE_PREFIX) && !currentCaches.includes(cacheName)) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clean up old cache entries
      cleanupOldCacheEntries()
    ])
    .then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Route to appropriate handler based on request type
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isFontRequest(request)) {
    event.respondWith(handleFontRequest(request));
  } else if (url.origin === self.location.origin) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleExternalRequest(request));
  }
});

// Handle API requests with different caching strategies
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Determine caching strategy
  let strategy = 'networkFirst'; // default
  
  for (const [strategyName, endpoints] of Object.entries(CACHEABLE_APIS)) {
    if (endpoints.some(endpoint => {
      const pattern = endpoint.replace(/\[\\w+\]/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(pathname);
    })) {
      strategy = strategyName;
      break;
    }
  }
  
  switch (strategy) {
    case 'cacheFirst':
      return await cacheFirstStrategy(request, API_CACHE_NAME);
    case 'staleWhileRevalidate':
      return await staleWhileRevalidateStrategy(request, API_CACHE_NAME);
    case 'networkFirst':
    default:
      return await networkFirstStrategy(request, API_CACHE_NAME);
  }
}

// Caching strategies
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const responseToCache = networkResponse.clone();
      addTimestamp(responseToCache);
      await cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse('Cache first strategy failed');
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();
      addTimestamp(responseToCache);
      await cache.put(request, responseToCache);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse('Network unavailable');
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network and update cache in background
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      const responseToCache = response.clone();
      addTimestamp(responseToCache);
      cache.put(request, responseToCache);
    }
    return response;
  }).catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network response
  const networkResponse = await networkResponsePromise;
  return networkResponse || createOfflineResponse('Stale while revalidate failed');
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first for navigation
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    return cachedResponse;
  } catch (error) {
    // Return cached version or offline page
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/offline.html') || 
             await caches.match('/') ||
             new Response('Offline', { status: 503, statusText: 'Offline' });
    }
    
    return new Response('Resource unavailable offline', { status: 503 });
  }
}

// Handle image requests
async function handleImageRequest(request) {
  return await cacheFirstStrategy(request, IMAGE_CACHE_NAME);
}

// Handle font requests
async function handleFontRequest(request) {
  return await cacheFirstStrategy(request, FONT_CACHE_NAME);
}

// Handle external requests
async function handleExternalRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return new Response('External resource unavailable', { status: 503 });
  }
}

// Utility functions
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname) ||
         request.destination === 'image';
}

function isFontRequest(request) {
  const url = new URL(request.url);
  return /\.(woff|woff2|eot|ttf|otf)$/i.test(url.pathname) ||
         request.destination === 'font';
}

function isExpired(response) {
  const timestamp = response.headers.get('sw-timestamp');
  if (!timestamp) return false;
  
  const age = Date.now() - parseInt(timestamp);
  return age > CACHE_CONFIG.maxAge.api;
}

function addTimestamp(response) {
  response.headers.set('sw-timestamp', Date.now().toString());
}

function createOfflineResponse(message) {
  return new Response(
    JSON.stringify({ 
      error: message,
      offline: true,
      timestamp: Date.now()
    }),
    { 
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    }
  );
}

// Clean up old cache entries
async function cleanupOldCacheEntries() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (!cacheName.startsWith(CACHE_PREFIX)) continue;
    
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    // Remove expired entries
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && isExpired(response)) {
        await cache.delete(request);
        console.log('🗑️ Removed expired cache entry:', request.url);
      }
    }
    
    // Limit cache size
    const maxEntries = getMaxEntriesForCache(cacheName);
    if (requests.length > maxEntries) {
      const oldestRequests = requests.slice(0, requests.length - maxEntries);
      for (const request of oldestRequests) {
        await cache.delete(request);
        console.log('🗑️ Removed old cache entry for size limit:', request.url);
      }
    }
  }
}

function getMaxEntriesForCache(cacheName) {
  if (cacheName.includes('api')) return CACHE_CONFIG.maxEntries.api;
  if (cacheName.includes('images')) return CACHE_CONFIG.maxEntries.images;
  return CACHE_CONFIG.maxEntries.dynamic;
}

// Enhanced push notification event
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  let notificationData = {
    title: 'Astral Field',
    body: 'You have a new fantasy football update!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'fantasy-update',
    requireInteraction: false,
    data: { url: '/dashboard' },
    actions: [
      {
        action: 'view',
        title: 'View Update',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };

  // Parse push data if available
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
      
      // Handle different notification types
      switch (pushData.type) {
        case 'score-update':
          notificationData.title = '⚡ Score Update';
          notificationData.body = `${pushData.teamName}: ${pushData.score} points`;
          notificationData.tag = 'score-update';
          notificationData.data.url = '/live';
          break;
        case 'matchup-reminder':
          notificationData.title = '🏈 Matchup Reminder';
          notificationData.body = pushData.message;
          notificationData.tag = 'matchup-reminder';
          notificationData.requireInteraction = true;
          break;
        case 'waiver-alert':
          notificationData.title = '🔄 Waiver Alert';
          notificationData.body = pushData.message;
          notificationData.tag = 'waiver-alert';
          notificationData.data.url = '/waivers';
          break;
        case 'trade-notification':
          notificationData.title = '🤝 Trade Notification';
          notificationData.body = pushData.message;
          notificationData.tag = 'trade-notification';
          notificationData.data.url = '/trades';
          break;
      }
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(notificationData.title, notificationData),
      updateNotificationBadge()
    ])
  );
});

// Update notification badge
async function updateNotificationBadge() {
  try {
    const notifications = await self.registration.getNotifications();
    const badgeCount = notifications.length;
    
    // Update app badge if supported
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(badgeCount);
    }
  } catch (error) {
    console.error('Error updating notification badge:', error);
  }
}

// Enhanced notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action, event.notification.data);
  
  event.notification.close();
  
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/dashboard';

  if (event.action === 'dismiss') {
    return;
  }

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      handleNotificationClick(targetUrl, event.notification.tag)
    );
  }
});

// Handle notification click with smart app opening
async function handleNotificationClick(targetUrl, tag) {
  try {
    const clientList = await clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    });
    
    // Find existing app window
    for (const client of clientList) {
      if (client.url.includes(self.location.origin)) {
        await client.focus();
        if (client.navigate) {
          await client.navigate(targetUrl);
        } else {
          client.postMessage({ 
            type: 'NAVIGATE', 
            url: targetUrl,
            source: 'notification'
          });
        }
        return;
      }
    }
    
    // No existing window, open new one
    if (clients.openWindow) {
      await clients.openWindow(targetUrl);
    }
    
    // Clear notification badge
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge();
    }
    
    // Track notification interaction
    trackNotificationInteraction(tag, 'clicked');
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
}

// Track notification interactions for analytics
function trackNotificationInteraction(tag, action) {
  clients.matchAll().then(clientList => {
    for (const client of clientList) {
      client.postMessage({
        type: 'ANALYTICS_EVENT',
        event: 'notification_interaction',
        data: { tag, action, timestamp: Date.now() }
      });
    }
  });
}

// Enhanced background sync event
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'score-sync':
      event.waitUntil(syncScores());
      break;
    case 'lineup-sync':
      event.waitUntil(syncLineup());
      break;
    case 'draft-sync':
      event.waitUntil(syncDraftPicks());
      break;
    case 'trade-sync':
      event.waitUntil(syncTradeProposals());
      break;
    case 'waiver-sync':
      event.waitUntil(syncWaiverClaims());
      break;
    case 'analytics-sync':
      event.waitUntil(syncAnalytics());
      break;
  }
});

// Enhanced message event handling
self.addEventListener('message', (event) => {
  console.log('📨 Service Worker message received:', event.data);
  
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(DYNAMIC_CACHE_NAME)
          .then(cache => cache.addAll(payload.urls))
      );
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearSpecificCache(payload.cacheNames));
      break;
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(sendCacheStatus(event.ports[0]));
      break;
      
    case 'PREFETCH_RESOURCES':
      event.waitUntil(prefetchResources(payload.urls));
      break;
      
    case 'SYNC_REQUEST':
      event.waitUntil(
        self.registration.sync.register(payload.tag)
      );
      break;
  }
});

// Clear specific caches
async function clearSpecificCache(cacheNames) {
  for (const cacheName of cacheNames) {
    await caches.delete(cacheName);
    console.log('🗑️ Cleared cache:', cacheName);
  }
}

// Send cache status to client
async function sendCacheStatus(port) {
  const cacheNames = await caches.keys();
  const status = {
    caches: cacheNames.filter(name => name.startsWith(CACHE_PREFIX)),
    version: CACHE_VERSION,
    timestamp: Date.now()
  };
  
  port.postMessage({ type: 'CACHE_STATUS', payload: status });
}

// Prefetch resources
async function prefetchResources(urls) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('📥 Prefetched:', url);
      }
    } catch (error) {
      console.warn('Failed to prefetch:', url, error);
    }
  }
}

// Enhanced IndexedDB helper functions
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      const stores = ['scoreUpdates', 'lineupChanges', 'draftPicks', 'tradeProposals', 'waiverClaims', 'analytics'];
      
      for (const storeName of stores) {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          if (storeName === 'scoreUpdates' || storeName === 'analytics') {
            store.createIndex('timestamp', 'timestamp');
          }
          if (storeName === 'lineupChanges') {
            store.createIndex('leagueId', 'leagueId');
          }
        }
      }
    };
  });
}

async function getPendingScoreUpdates() {
  return await getPendingData('scoreUpdates');
}

async function getPendingLineupChanges() {
  return await getPendingData('lineupChanges');
}

async function getPendingDraftPicks() {
  return await getPendingData('draftPicks');
}

async function getPendingTradeProposals() {
  return await getPendingData('tradeProposals');
}

async function getPendingWaiverClaims() {
  return await getPendingData('waiverClaims');
}

async function getPendingAnalytics() {
  return await getPendingData('analytics');
}

async function getPendingData(storeName) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error getting pending ${storeName}:`, error);
    return [];
  }
}

async function removePendingUpdate(id) {
  await removePendingData('scoreUpdates', id);
}

async function removePendingLineupChange(id) {
  await removePendingData('lineupChanges', id);
}

async function removePendingData(storeName, id) {
  try {
    const db = await openDatabase();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.delete(id);
    console.log(`Removed pending ${storeName}:`, id);
  } catch (error) {
    console.error(`Error removing pending ${storeName}:`, error);
  }
}

// Enhanced sync functions
async function syncScores() {
  try {
    console.log('📊 Syncing scores...');
    
    const pendingUpdates = await getPendingScoreUpdates();
    let syncedCount = 0;
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/live/scores', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Sync-Request': 'true'
          },
          body: JSON.stringify(update)
        });
        
        if (response.ok) {
          await removePendingUpdate(update.id);
          syncedCount++;
        } else {
          console.warn('Score sync failed for update:', update.id, response.status);
        }
      } catch (error) {
        console.error('Failed to sync score update:', update.id, error);
      }
    }
    
    console.log(`✅ Score sync completed: ${syncedCount}/${pendingUpdates.length} updates synced`);
    notifyClients('SYNC_COMPLETED', { type: 'scores', count: syncedCount });
    
  } catch (error) {
    console.error('❌ Score sync failed:', error);
    notifyClients('SYNC_FAILED', { type: 'scores', error: error.message });
  }
}

async function syncLineup() {
  try {
    console.log('👥 Syncing lineup changes...');
    
    const pendingChanges = await getPendingLineupChanges();
    let syncedCount = 0;
    
    for (const change of pendingChanges) {
      try {
        const response = await fetch(`/api/leagues/${change.leagueId}/roster`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Sync-Request': 'true'
          },
          body: JSON.stringify(change)
        });
        
        if (response.ok) {
          await removePendingLineupChange(change.id);
          syncedCount++;
        }
      } catch (error) {
        console.error('Failed to sync lineup change:', change.id, error);
      }
    }
    
    console.log(`✅ Lineup sync completed: ${syncedCount}/${pendingChanges.length} changes synced`);
    notifyClients('SYNC_COMPLETED', { type: 'lineup', count: syncedCount });
    
  } catch (error) {
    console.error('❌ Lineup sync failed:', error);
    notifyClients('SYNC_FAILED', { type: 'lineup', error: error.message });
  }
}

async function syncDraftPicks() {
  const pending = await getPendingDraftPicks();
  console.log('🏈 Draft picks sync:', pending.length);
}

async function syncTradeProposals() {
  const pending = await getPendingTradeProposals();
  console.log('🤝 Trade proposals sync:', pending.length);
}

async function syncWaiverClaims() {
  const pending = await getPendingWaiverClaims();
  console.log('🔄 Waiver claims sync:', pending.length);
}

async function syncAnalytics() {
  const pending = await getPendingAnalytics();
  console.log('📈 Analytics sync:', pending.length);
}

// Notify all clients
function notifyClients(type, data) {
  clients.matchAll().then(clientList => {
    for (const client of clientList) {
      client.postMessage({ type, data, timestamp: Date.now() });
    }
  });
}

// Periodic background sync for PWAs
self.addEventListener('periodicsync', (event) => {
  console.log('⏰ Periodic sync triggered:', event.tag);
  
  if (event.tag === 'score-updates') {
    event.waitUntil(syncScores());
  }
});

// Handle app updates
self.addEventListener('appinstalled', (event) => {
  console.log('📱 App installed successfully');
  
  clients.matchAll().then(clientList => {
    for (const client of clientList) {
      client.postMessage({
        type: 'APP_INSTALLED',
        timestamp: Date.now()
      });
    }
  });
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker unhandled rejection:', event.reason);
});

console.log('🚀 Service Worker script loaded - Version:', CACHE_VERSION);
console.log('📊 Cache configuration:', CACHE_CONFIG);
console.log('🎯 API caching strategies:', Object.keys(CACHEABLE_APIS));