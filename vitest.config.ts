import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
    environmentOptions: { nuxt: { domEnvironment: 'happy-dom' } },
    include: ['test/nuxt/**/*.spec.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['app/**/*.{ts,vue}', 'shared/**/*.ts'],
      reporter: ['text', 'html']
    }
  }
})
