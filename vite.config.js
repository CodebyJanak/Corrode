import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Must be './' for Electron (loads from file://) and Capacitor (loads from device)
  base: './',
  build: {
    outDir: 'dist',
    // Copy sql.js WASM file into dist so it's available at runtime
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          d3: ['d3'],
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  // Make sql.js WASM findable
  optimizeDeps: {
    exclude: ['sql.js']
  }
})
