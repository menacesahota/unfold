import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mailers: resolve(__dirname, 'mailer-boxes.html'),
        shipping: resolve(__dirname, 'shipping-boxes.html'),
        retail: resolve(__dirname, 'retail-boxes.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        portal: resolve(__dirname, 'portal.html'),
        portalOrder: resolve(__dirname, 'portal-order.html'),
        portalAdmin: resolve(__dirname, 'portal-admin.html'),
        spec: resolve(__dirname, 'spec.html'),
        ppwr: resolve(__dirname, 'ppwr.html'),
      },
    },
  },
})
