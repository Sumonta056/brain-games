import tailwindcss from '@tailwindcss/vite'

// Brain Games — Nuxt 4 (app/ directory). Client-only for now: all progress lives in localStorage.
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/icon'],
  icon: {
    mode: 'svg',
    provider: 'none',
    fallbackToApi: false,
    serverBundle: false,
    clientBundle: { includeCustomCollections: true },
    customCollections: [{ prefix: 'bg', dir: './app/assets/icons', recursive: true }]
  },
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  // Components are referenced by file name only (<GameTile>, not <HomeGameTile>).
  components: [{ path: '~/components', pathPrefix: false, extensions: ['vue'] }],
  typescript: { strict: true },
  app: {
    head: {
      title: 'Brain Games — relax and sharpen your mind',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Short, friendly brain games to relax and sharpen your mind.' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'icon', href: '/favicon.ico', sizes: '32x32' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Lexend:wght@300;400;500;600&display=swap'
        }
      ]
    }
  }
})
