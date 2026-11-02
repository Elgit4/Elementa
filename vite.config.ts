import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      // Prompt (not auto-update) so a student is never reloaded mid-quiz and stale caches are replaced deliberately.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Elementa: Chemistry Learning',
        short_name: 'Elementa',
        description: 'Interactive chemistry learning for Ghanaian SHS students. Works offline.',
        theme_color: '#101828',
        background_color: '#101828',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell, all code, styles, bundled chemistry data and the Latin font subsets.
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}', '**/*-latin-*.woff2', '**/*-latin-ext-*.woff2'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
