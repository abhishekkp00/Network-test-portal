import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Enable code splitting — each page chunk loads independently
    rollupOptions: {
      output: {
        // Vite 8 uses Rolldown which requires manualChunks as a function
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
        },
      },
    },
    // Increase warning threshold to 700kB (reasonable for a React admin app)
    chunkSizeWarningLimit: 700,
  },
  server: {
    // Vite dev server proxy — routes /api/v1 to the running Spring Boot backend
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
    },
  },
})
