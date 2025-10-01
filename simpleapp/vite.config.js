import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Proxy backend in dev so fetch('/api/…') and '/static/…' just work
    proxy: {
      '/api': 'http://localhost:8000',
      '/static': 'http://localhost:8000'
    }
  },
  build: {
    outDir: 'dist'
  }
})
