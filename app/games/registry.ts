import { defineAsyncComponent, type Component } from 'vue'

/**
 * Maps `component` in app/data/games/<id>.json → the Vue game component.
 * Every game component: props { game: GameDef }, emits finish(score: number). Nothing else.
 * To port a game: copy RUN.<id> from docs/design.html into app/games/<Component>.vue, then add one line here.
 */
export const gameComponents: Record<string, Component> = {
  MentalMath: defineAsyncComponent(() => import('./MentalMath.vue')),
  ReactionTime: defineAsyncComponent(() => import('./ReactionTime.vue')),
  BoxBreathing: defineAsyncComponent(() => import('./BoxBreathing.vue')),
  ComingSoon: defineAsyncComponent(() => import('./ComingSoon.vue'))
}
