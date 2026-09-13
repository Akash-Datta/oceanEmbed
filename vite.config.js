import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /api to the backend in dev so the browser makes a SAME-ORIGIN
    // request (no CORS preflight needed). The backend on :5000 still has an
    // explicit CORS allowlist for direct cross-origin calls (e.g. prod).
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
})
