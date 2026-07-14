import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Active in dev (.env.development leaves VITE_API_URL empty, so calls stay
  // relative and this proxy handles them - no CORS needed for dev at all).
  server: {
    port: 5173,
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // Unused in practice - .env.production sets VITE_API_URL, so build/preview
  // call the backend directly rather than routing through this proxy. Kept as
  // a fallback for if VITE_API_URL is ever cleared for a production build.
  preview: {
    port: 4173,
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
