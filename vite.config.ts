import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/our-first-story-app/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg'],
      manifest: {
        name: '우리의 첫 이야기',
        short_name: '첫 이야기',
        description: '임신부터 육아까지 함께 기록하는 가족 성장 앨범',
        theme_color: '#fff9f3',
        background_color: '#fff9f3',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [{src: 'app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable'}],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  server: {port: 5173},
});
