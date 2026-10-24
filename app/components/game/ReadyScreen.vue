<template>
  <div
    class="grid grid-cols-[1fr_1fr] items-center gap-[22px] max-lg:grid-cols-[1fr] max-md:gap-3.5"
    data-testid="ready"
  >
    <div>
      <h2
        class="mx-0 mt-0 mb-2 font-display text-[length:clamp(34px,5vw,52px)] leading-none font-extrabold max-md:text-[34px]"
      >
        Ready?
      </h2>
      <p class="mx-0 mt-0 mb-5 text-muted max-md:mb-3.5">{{ game.blurb }}. Watch the demo, then jump in.</p>
      <button ref="btn" class="go" @click="$emit('start')">Start ▸</button>
      <div class="mt-3 text-[13px] text-muted max-md:hidden">
        or press
        <kbd
          class="rounded-[6px] border border-b-[3px] border-line bg-raise px-1.5 py-px font-body text-[12px] leading-[normal] font-semibold"
          >Enter</kbd
        >
      </div>
    </div>
    <div class="flex min-h-[250px] flex-col rounded-card bg-tint-bg p-4 max-md:order-[-1] max-md:min-h-[190px]">
      <div class="flex justify-between font-display text-[13px] leading-[normal] font-bold text-tint-fg">
        <span>Quick demo</span><span>auto-plays</span>
      </div>
      <div
        class="grid min-h-[170px] flex-1 place-items-center text-center max-md:min-h-[120px]"
        data-testid="scene"
        v-html="game.demo[frame]!.scene"
      />
      <div class="min-h-[1.5em] text-center font-medium" data-testid="caption">{{ game.demo[frame]!.caption }}</div>
      <div class="mt-2 flex justify-center gap-1.5" data-testid="dots">
        <i
          v-for="(_, i) in game.demo"
          :key="i"
          class="size-2 rounded-[50%] bg-[color-mix(in_srgb,var(--tfg)_30%,transparent)] data-[state=on]:bg-tint-fg"
          :data-state="i === frame ? 'on' : undefined"
        />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ start: [] }>()
const frame = ref(0)
const btn = ref<HTMLButtonElement>()
let t: ReturnType<typeof setInterval>
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('start')
  }
}
onMounted(() => {
  btn.value?.focus()
  t = setInterval(() => {
    frame.value = (frame.value + 1) % props.game.demo.length
  }, 2200)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  clearInterval(t)
  window.removeEventListener('keydown', onKey)
})
</script>
