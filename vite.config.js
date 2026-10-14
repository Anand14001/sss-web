import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Absolute base. The site now has nested routes (/registration/kid), and with a
// relative base the browser would resolve ./assets/... against /registration/,
// giving 404s on any direct load of a nested URL. The trade-off is that the
// build must be served from the document root, not a subdirectory — see README.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
