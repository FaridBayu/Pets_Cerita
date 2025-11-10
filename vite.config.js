import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: resolve(__dirname, 'src'),


  publicDir: resolve(__dirname, 'src', 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  plugins: [
    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Peta Cerita',
        short_name: 'Peta Cerita',
        description: 'Bagikan dan temukan cerita di seluruh dunia.',
        theme_color: '#4A6D4D',
        background_color: '#F5F5F1',
        display: 'standalone',

        scope: '/',
        start_url: '/index.html',
        icons: [
          {
            src: '/images/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/images/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        screenshots: [
          {
            src: '/images/screenshot1.png',
            sizes: '1902x907',
            type: 'image/png',
            form_factor: 'wide'
          },
          {
            src: '/images/screenshot1.png',
            sizes: '1902x907',
            type: 'image/png'
          }
        ]
      },

      strategies: 'injectManifest',
      srcDir: '.',
      filename: 'sw.js'
    })
  ]
});