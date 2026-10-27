<template>
  <div>
    <div class="hud">
      <span>Length {{ shownLen }}</span
      ><span>Score {{ best }}</span>
    </div>
    <div class="big" data-testid="digit">{{ shown }}</div>
    <input
      ref="inp"
      v-model="answer"
      class="field"
      inputmode="numeric"
      autocomplete="off"
      aria-label="Digits"
      :disabled="locked"
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
const { later } = useTimeouts()
const stepMs = setting(props.game, 'stepMs')
const len = ref(setting(props.game, 'start'))
const shownLen = ref(len.value)
const best = ref(0)
const shown = ref('')
const answer = ref('')
const fb = ref('')
const ok = ref(false)
const locked = ref(true)
const inp = ref<HTMLInputElement>()
let strikes = 0
let seq = ''

function play() {
  shownLen.value = len.value
  seq = Array.from({ length: len.value }, () => ri(0, 9)).join('')
  answer.value = ''
  locked.value = true
  ok.value = false
  fb.value = 'Watch…'
  shown.value = ''
  ;[...seq].forEach((d, i) => {
    later(() => (shown.value = d), i * stepMs)
    later(() => (shown.value = ''), i * stepMs + stepMs - 250)
  })
  later(
    async () => {
      shown.value = '?'
      locked.value = false
      fb.value = `Type all ${len.value} digits`
      await nextTick()
      inp.value?.focus()
    },
    len.value * stepMs + 200
  )
}
function onEnter() {
  if (locked.value) return
  locked.value = true
  if (answer.value.replace(/\D/g, '') === seq) {
    best.value = len.value
    len.value++
    strikes = 0
    ok.value = true
    fb.value = 'Correct! One more digit.'
    cheer()
    later(play, 1000)
    return
  }
  strikes++
  ok.value = false
  fb.value = `It was ${seq}${strikes < 2 ? '. One more try at this length.' : ''}`
  if (strikes >= 2) later(() => emit('finish', best.value), 1500)
  else later(play, 1700)
}
onMounted(play)
</script>
