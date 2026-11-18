/** @type {import('workbox-build').GenerateSWConfig} */
module.exports = {
  globDirectory: 'dist/',
  globPatterns: ['**/*.{js,css,html,png,ico,svg,woff2,json,webp}'],
  swDest: 'dist/sw.js',
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  // Conservative updates: wait for tabs to close before activating a new SW.
  skipWaiting: false,
  clientsClaim: false,
  // Multi-page static export: do not SPA-fallback unknown routes to index.html.
  runtimeCaching: [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        networkTimeoutSeconds: 3,
      },
    },
    {
      urlPattern: ({ request }) =>
        request.destination === 'style' ||
        request.destination === 'script' ||
        request.destination === 'worker',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'assets',
      },
    },
    {
      urlPattern: ({ request }) => request.destination === 'image',
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
  ],
};
