import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    rules: {
      'vue/no-v-html': 'error'
    }
  },
  {
    files: [
      'app/components/app/GameIcon.vue',
      'app/components/app/NavIcon.vue',
      'app/components/game/ReadyScreen.vue',
      'app/components/home/GameTile.vue'
    ],
    rules: {
      'vue/no-v-html': 'off'
    }
  },
  prettier
)
