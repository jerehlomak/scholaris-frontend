import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import legacy from "@vitejs/plugin-legacy"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    legacy({
      targets: ['defaults', 'not IE 11', 'Safari >= 13', 'iOS >= 13'],
    }),
  ],
  build: {
    target: 'es2015',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})