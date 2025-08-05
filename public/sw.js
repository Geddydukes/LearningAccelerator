import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Agent JSON notes - stale-while-revalidate 24h
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/agent/'),
  new StaleWhileRevalidate({
    cacheName: 'agent-notes-v1',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        maxEntries: 50
      })
    ]
  })
);

// ElevenLabs audio - cache-first 7 days
registerRoute(
  ({ url }) => url.pathname.includes('/tts-cache/'),
  new CacheFirst({
    cacheName: 'tts-audio-v1',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        maxEntries: 100
      })
    ]
  })
);

// Static assets - cache first
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-v1',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 60
      })
    ]
  })
);

// Install prompt handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});