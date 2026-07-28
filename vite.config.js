import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        portal: resolve(__dirname, 'portal.html'),
        portalOrder: resolve(__dirname, 'portal-order.html'),
        portalAdmin: resolve(__dirname, 'portal-admin.html'),
      },
    },
  },
})
