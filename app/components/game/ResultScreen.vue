<template>
  <div class="text-center" data-testid="result">
    <div class="text-[52px] leading-none" data-testid="emoji">{{ emoji }}</div>
    <div
      class="bg-[linear-gradient(90deg,var(--accent-2),var(--accent))] bg-clip-text font-display text-[length:clamp(80px,14vw,130px)] leading-none font-extrabold text-transparent [-webkit-background-clip:text]"
      data-testid="score"
    >
      {{ score }}
    </div>
    <div class="font-medium text-muted" data-testid="unit">{{ game.unit }}</div>
    <h2 class="mx-0 mt-2.5 mb-1 font-display text-[34px] leading-[1.1] font-extrabold max-md:text-[28px]">
      {{ band.label }}
    </h2>
    <p class="mx-auto my-1.5 max-w-[52ch] text-muted">{{ band.message }}</p>
    <div
      v-if="result.isPB && result.prev != null"
      class="mt-2 inline-block rounded-pill bg-sun-bg px-3.5 py-[3px] font-semibold text-sun-fg"
      data-testid="pb-tag"
    >
      New personal best! Up from {{ result.prev }}
    </div>
    <div
      v-else-if="result.prev == null"
      class="mt-2 inline-block rounded-pill bg-sun-bg px-3.5 py-[3px] font-semibold text-sun-fg"
      data-testid="pb-tag"
    >
      First score planted 🌱
    </div>
    <p v-else class="mx-auto my-1.5 max-w-[52ch] text-muted">
      Your best is {{ result.prev }}. {{ close ? 'So close!' : 'Every round still counts.' }}
    </p>
    <div class="row">
      <button ref="again" class="go" @click="$emit('again')">Play again</button>
      <NuxtLink to="/games" class="ghost text-inherit no-underline">More games</NuxtLink>
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
