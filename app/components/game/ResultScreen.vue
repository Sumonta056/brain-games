<template>
  <div class="result">
    <div class="emo">{{ emoji }}</div>
    <div class="score">{{ score }}</div>
    <div class="unit">{{ game.unit }}</div>
    <h2>{{ band.label }}</h2>
    <p>{{ band.message }}</p>
    <div v-if="result.isPB && result.prev != null" class="pbtag">New personal best! Up from {{ result.prev }}</div>
    <div v-else-if="result.prev == null" class="pbtag">First score planted 🌱</div>
    <p v-else>Your best is {{ result.prev }}. {{ close ? 'So close!' : 'Every round still counts.' }}</p>
    <div class="row">
      <button ref="again" class="go" @click="$emit('again')">Play again</button>
      <NuxtLink to="/games" class="ghost" style="text-decoration: none; color: inherit">More games</NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{
  game: GameDef
  score: number
  result: { prev: number | null; isPB: boolean; band: number }
}>()
defineEmits<{ again: [] }>()
const again = ref<HTMLButtonElement>()
onMounted(() => {
  again.value?.focus()
  if (props.result.isPB && props.result.prev != null) confetti()
})
const band = computed(() => props.game.bands[props.result.band]!)
const emoji = computed(
  () =>
    ['🌱', '🌿', '🌼', '🌟', '🏆'][
      Math.min(4, Math.round((props.result.band / Math.max(1, props.game.bands.length - 1)) * 4))
    ]
)
const close = computed(
  () => props.result.prev != null && Math.abs(props.score - props.result.prev) <= (props.game.lowerIsBetter ? 2 : 1)
)
</script>
