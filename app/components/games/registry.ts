import { defineAsyncComponent, type Component } from 'vue'

export const gameComponents: Record<string, Component> = {
  MentalMath: defineAsyncComponent(() => import('./MentalMath.vue')),
  ReactionTime: defineAsyncComponent(() => import('./ReactionTime.vue')),
  BoxBreathing: defineAsyncComponent(() => import('./BoxBreathing.vue')),
  ComingSoon: defineAsyncComponent(() => import('./ComingSoon.vue'))
}
