import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': { target: 'http://localhost:8080', ws: true },
      '/ws-native': { target: 'http://localhost:8080', ws: true },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/ws': { target: 'http://localhost:8080', ws: true },
      '/ws-native': { target: 'http://localhost:8080', ws: true },
    },
  },
  build: {
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true,
  },
  define: {
    // Fix SockJS global reference issue
    global: 'globalThis',
  },
})