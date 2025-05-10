// Minimal Service Worker untuk submission
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Simple static cache strategy
const CACHE_NAME = 'story-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.webmanifest',
  '/favicon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Event untuk push notification
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Notifikasi Baru',
    options: {
      body: 'Anda menerima notifikasi baru',
      icon: '/favicon.png',
    },
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        options: {
          ...notificationData.options,
          body: data.options?.body || notificationData.options.body,
        },
      };
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData.options)
  );
});

// Event ketika notifikasi diklik
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientsList) => {
        // Jika sudah ada window yang terbuka, fokus ke sana
        if (clientsList.length > 0) {
          const client = clientsList[0];
          client.navigate('/');
          return client.focus();
        }
        // Jika tidak ada window yang terbuka, buka yang baru
        return clients.openWindow('/');
      })
  );
});