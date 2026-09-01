import { defineConfig } from 'vite'
import { resolve } from 'path'

const htmlPages = new Set([
  '/portal',
  '/ppwr',
  '/spec',
  '/pricing',
  '/portal-order',
  '/portal-admin',
])

function rewriteCleanHtmlUrl(req, _res, next) {
  const path = req.url?.split('?')[0] ?? ''
  if (htmlPages.has(path)) {
    req.url = req.url.replace(path, `${path}.html`)
  }
  next()
}

function cleanHtmlUrls() {
  return {
    name: 'clean-html-urls',
    configureServer(server) {
      server.middlewares.use(rewriteCleanHtmlUrl)
    },
    configurePreviewServer(server) {
      server.middlewares.use(rewriteCleanHtmlUrl)
    },
  }
}

export default defineConfig({
  root: '.',
  plugins: [cleanHtmlUrls()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
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
