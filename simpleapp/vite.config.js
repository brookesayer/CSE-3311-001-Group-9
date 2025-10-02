// frontend/vite.config.ts — dev proxy so you avoid CORS entirely in dev
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // any call beginning with /api will be proxied to the FastAPI backend
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
      // optional: also proxy /static from backend
      "/static": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
