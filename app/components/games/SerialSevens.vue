<template>
  <div>
    <div class="bar"><i :style="{ width: fraction * 100 + '%' }" /></div>
    <div class="hud">
      <span>Subtract 7 each time</span><span data-testid="score">Score {{ n }}</span>
    </div>
    <div class="big" data-testid="current">{{ cur }}</div>
    <input
      ref="inp"
      v-model="answer"
      class="field"
      inputmode="numeric"
      autocomplete="off"
      aria-label="Next number"
      @keydown.enter="onEnter"
    />
    <p class="note" :class="{ ok }" data-testid="feedback" :data-state="ok ? 'ok' : undefined">{{ fb }}</p>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const cur = ref(ri(100, 200))
const n = ref(0)
const answer = ref('')
const fb = ref('Press Enter after each number')
const ok = ref(false)
const inp = ref<HTMLInputElement>()

function onEnter() {
  if (answer.value.trim() === '') return
  const want = cur.value - 7
  if (Number(answer.value) === want) {
    n.value++
    ok.value = true
    fb.value = 'Correct'
    if (n.value % 4 === 0) cheer()
  } else {
    ok.value = false
    fb.value = `It was ${want}. No worries, carry on from there.`
  }
  cur.value = want
  if (cur.value < 7) {
    cur.value = ri(100, 200)
    fb.value += ' Fresh start number!'
  }
  answer.value = ''
}
const { fraction, start } = useCountdown(props.game.durationSec ?? 60, () => emit('finish', n.value))
onMounted(() => {
  start()
  inp.value?.focus()
})
</script>
