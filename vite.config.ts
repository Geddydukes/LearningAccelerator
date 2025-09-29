import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.wisely\.com\/agent\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'agent-notes-v1',
              expiration: {
                maxAgeSeconds: 24 * 60 * 60, // 24 hours
                maxEntries: 50
              }
            }
          },
          {
            urlPattern: /\/tts-cache\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tts-audio-v1',
              expiration: {
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
                maxEntries: 100
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Wisely - Multi-Agent Learning Platform',
        short_name: 'Wisely',
        description: 'Experience the future of learning with our multi-agent AI platform',
        theme_color: '#3b82f6',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion'],
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          ui: ['lucide-react', 'react-hot-toast']
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
});
