import { defineConfig } from 'vite'
import { resolve } from 'path'

// Clean paths Render already serves for these HTML documents.
// Includes portal/ppwr/spec/pricing so local dev and preview match
// those routes and do not shadow them.
const htmlPages = new Set([
  '/packaging',
  '/start',
  '/product',
  '/samples',
  '/artwork',
  '/approach',
  '/quotes',
  '/portal',
  '/ppwr',
  '/spec',
  '/pricing',
  '/portal-order',
  '/portal-admin',
])

function rewriteCleanHtmlUrl(req, _res, next) {
  const raw = req.url ?? ''
  const queryAt = raw.indexOf('?')
  const path = queryAt === -1 ? raw : raw.slice(0, queryAt)
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
  if (htmlPages.has(normalized)) {
    const query = queryAt === -1 ? '' : raw.slice(queryAt)
    req.url = `${normalized}.html${query}`
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
        packaging: resolve(__dirname, 'packaging.html'),
        product: resolve(__dirname, 'product.html'),
        samples: resolve(__dirname, 'samples.html'),
        artwork: resolve(__dirname, 'artwork.html'),
        approach: resolve(__dirname, 'approach.html'),
        start: resolve(__dirname, 'start.html'),
        quotes: resolve(__dirname, 'quotes.html'),
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
