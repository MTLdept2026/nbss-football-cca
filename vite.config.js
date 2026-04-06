import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      registerType: 'prompt',
      injectRegister: 'auto',
      manifest: false, // we have our own public/manifest.json
      injectManifest: {
        swSrc: 'public/sw.js',
      },
    }),
  ],
  build: {
    outDir: 'dist'
  }
})
