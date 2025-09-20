import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: { host: 'localhost', clientPort: 5173, protocol: 'ws' },
    proxy: {
      '/api': {
        target: 'http://api:8000',    // the FastAPI container
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')  // <-- key fix
      }
    }
  }
})
