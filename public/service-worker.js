const CACHE_NAME = 'tom-ai-coach-v2.0.1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/homepage.jsx',
  '/src/AIChatAssistant.jsx',
  '/src/ProfileCreation.jsx',
  '/src/WorkoutContext.jsx',
  '/favicon/favicon.ico',
  '/favicon/android-chrome-192x192.png',
  '/favicon/android-chrome-512x512.png'
];

// Assets to cache on install
const ASSETS_TO_CACHE = [
  ...APP_SHELL,
  '/favicon/apple-touch-icon.png',
  '/favicon/favicon-16x16.png',
  '/favicon/favicon-32x32.png',
  '/favicon/favicon.svg',
  '/favicon/site.webmanifest'
];

// Assets to cache on first use
const RUNTIME_CACHE = [
  '/src/components/NavigationMenu.jsx',
  '/src/components/MobileAppInstallBanner.jsx',
  '/src/components/progress/ProgressDataContent.jsx',
  '/src/components/workout/Header.jsx',
  '/src/components/workout/TabNavigation.jsx',
  '/exercises.json'
];

// Network-first resources (always try network first, fallback to cache)
const API_RESOURCES = [
  '/.netlify/functions/ai-chat',
  '/.netlify/functions/moondream-analysis',
  '/.netlify/functions/process-request'
];

// Install event handler - Cache app shell and critical assets
self.addEventListener('install', event => {
  self.skipWaiting(); // Ensure new service worker activates immediately
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell and assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event handler - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName.startsWith('tom-ai-coach-') && cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker activated, now controlling page');
      return self.clients.claim(); // Take control of all clients/pages
    })
  );
});

// Helper: Cache runtime resources on first use
const cacheFirstUseResources = (url) => {
  if (RUNTIME_CACHE.some(pattern => url.includes(pattern))) {
    caches.open(CACHE_NAME)
      .then(cache => {
        fetch(url)
          .then(response => {
            if (response.status === 200) {
              cache.put(url, response.clone());
              console.log('Cached runtime resource:', url);
            }
          })
          .catch(error => console.error('Failed to cache resource:', url, error));
      });
  }
};

// Fetch event handler with different strategies for different resources
self.addEventListener('fetch', event => {
  // Don't cache POST requests (they can't be cached anyway)
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // API calls - Network first with timeout fallback
  if (API_RESOURCES.some(api => event.request.url.includes(api))) {
    event.respondWith(
      networkFirstWithTimeout(event.request, 3000) // 3 second timeout
    );
    return;
  }
  
  // Cache runtime resources after serving from network
  RUNTIME_CACHE.forEach(resource => {
    if (url.pathname.includes(resource)) {
      cacheFirstUseResources(event.request.url);
    }
  });
  
  // App shell and assets - Cache first strategy
  if (ASSETS_TO_CACHE.includes(url.pathname) || 
      APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return cached version but also update cache in background
            const fetchPromise = fetch(event.request)
              .then(networkResponse => {
                if (networkResponse.ok) {
                  const clonedResponse = networkResponse.clone();
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, clonedResponse);
                  });
                }
                return networkResponse;
              })
              .catch(() => {
                console.log('Failed to update cached asset, using cached version');
              });
                
            // Return cached response immediately
            return cachedResponse;
          }
          
          // If not in cache, try network
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Clone the response before returning it
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            })
            .catch(error => {
              console.error('Network fetch failed:', error);
              // If both cache and network fail, return offline fallback
              if (event.request.destination === 'document') {
                return caches.match('/offline.html');
              }
              return new Response('Network error happened', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
    return;
  }
  
  // Default strategy for everything else - Cache falling back to network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache, get from network
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone and cache for future
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          });
      })
  );
});

// Network first with timeout helper function
function networkFirstWithTimeout(request, timeout) {
  return new Promise(resolve => {
    let timeoutId;
    
    // Set timeout for network request
    const timeoutPromise = new Promise(timeoutResolve => {
      timeoutId = setTimeout(() => {
        timeoutResolve(caches.match(request));
      }, timeout);
    });
    
    // Try network request
    const networkPromise = fetch(request.clone())
      .then(response => {
        clearTimeout(timeoutId);
        
        // Cache successful response
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseClone);
            });
        }
        
        return response;
      })
      .catch(error => {
        clearTimeout(timeoutId);
        console.error('Network request failed:', error);
        return caches.match(request);
      });
      
    // Race network and timeout
    Promise.race([networkPromise, timeoutPromise])
      .then(resolve);
  });
}

// Handle push notifications
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'New update from Tom AI Coach',
    icon: '/favicon/android-chrome-192x192.png',
    badge: '/favicon/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tom AI Coach', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Check if there is already a window/tab open with the target URL
        const url = event.notification.data?.url || '/';
        
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is already open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Periodic background sync for workout data
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkoutData());
  }
});

// Function to sync workout data
async function syncWorkoutData() {
  try {
    // Implement workout data synchronization logic
    const lastSyncTimestamp = localStorage.getItem('last_workout_sync') || 0;
    const currentTimestamp = Date.now();
    
    // Record sync attempt
    localStorage.setItem('last_workout_sync_attempt', currentTimestamp);
    
    // Check for unsynchronized workout data
    // Actual implementation would depend on your data storage strategy
    
    // Update last successful sync timestamp
    localStorage.setItem('last_workout_sync', currentTimestamp);
    
    return true;
  } catch (error) {
    console.error('Background sync failed:', error);
    return false;
  }
}
