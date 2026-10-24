import { defineAsyncComponent, type Component } from 'vue'

export const gameComponents: Record<string, Component> = {
  MentalMath: defineAsyncComponent(() => import('./MentalMath.vue')),
  ReactionTime: defineAsyncComponent(() => import('./ReactionTime.vue')),
  BoxBreathing: defineAsyncComponent(() => import('./BoxBreathing.vue')),
  MemoryPairs: defineAsyncComponent(() => import('./MemoryPairs.vue')),
  OddColour: defineAsyncComponent(() => import('./OddColour.vue')),
  SerialSevens: defineAsyncComponent(() => import('./SerialSevens.vue')),
  WordSprint: defineAsyncComponent(() => import('./WordSprint.vue')),
  CategoryChallenge: defineAsyncComponent(() => import('./CategoryChallenge.vue')),
  BackwardSpelling: defineAsyncComponent(() => import('./BackwardSpelling.vue')),
  DigitSpan: defineAsyncComponent(() => import('./DigitSpan.vue')),
  SequenceMemory: defineAsyncComponent(() => import('./SequenceMemory.vue')),
  TwoBack: defineAsyncComponent(() => import('./TwoBack.vue')),
  StroopColours: defineAsyncComponent(() => import('./StroopColours.vue')),
  SchulteTable: defineAsyncComponent(() => import('./SchulteTable.vue')),
  OtherHandDay: defineAsyncComponent(() => import('./OtherHandDay.vue')),
  ComingSoon: defineAsyncComponent(() => import('./ComingSoon.vue'))
}
