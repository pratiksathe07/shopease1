import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,  // If 3000 is busy, use next available port
    open: true,         // Auto-open browser on start
    // Proxy API requests to backend — avoids CORS issues in dev
    proxy: {
      '/api': {
        target: 'https://shopease1-backend.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
