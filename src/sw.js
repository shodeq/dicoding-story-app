import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { clientsClaim } from 'workbox-core';

// Meng-claim clients dan skip waiting on install
self.skipWaiting();
clientsClaim();

// Precache - untuk App Shell
precacheAndRoute(self.__WB_MANIFEST || []);

// Cache Google Fonts
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || 
               url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts',
  })
);

// Cache untuk Font Awesome
registerRoute(
  ({ url }) => url.origin === 'https://cdnjs.cloudflare.com' && 
               url.pathname.startsWith('/ajax/libs/font-awesome/'),
  new CacheFirst({
    cacheName: 'font-awesome',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);

// Cache untuk Leaflet
registerRoute(
  ({ url }) => url.origin === 'https://unpkg.com' && 
               url.pathname.startsWith('/leaflet'),
  new CacheFirst({
    cacheName: 'leaflet-js',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);

// Cache untuk Leaflet Tiles
registerRoute(
  ({ url }) => url.href.includes('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 500, // Maksimal 500 tile di cache
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);

// Cache untuk Image
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
      }),
    ],
  })
);

// API Cache - Network First dengan fallback ke cache
registerRoute(
  ({ url }) => url.href.includes('story-api.dicoding.dev'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 1 hari
      }),
    ],
  })
);

// Fallback untuk navigasi - Untuk SPA
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'navigations',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);

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