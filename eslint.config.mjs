import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'vue/no-v-html': 'error'
    }
  },
  {
    files: ['app/components/game/ReadyScreen.vue'],
    rules: {
      'vue/no-v-html': 'off'
    }
  },
  prettier
)
