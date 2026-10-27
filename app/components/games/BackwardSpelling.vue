<template>
  <div>
    <div class="hud">
      <span data-testid="round">Round {{ shownRound }} of 8</span><span data-testid="score">Score {{ score }}</span>
    </div>
    <div class="big" data-testid="word">{{ shown }}</div>
    <input
      ref="inp"
      v-model="answer"
      class="field"
      autocomplete="off"
      autocapitalize="off"
      aria-label="Word spelled backwards"
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
const pools = gameContent(props.game, 'pools')
const minPool = setting(props.game, 'minPool')
const maxPool = setting(props.game, 'maxPool')
const showMs = setting(props.game, 'showMs')
const letterMs = setting(props.game, 'letterMs')
const round = ref(0)
const shownRound = ref(1)
const score = ref(0)
const shown = ref('')
const answer = ref('')
const fb = ref('')
const ok = ref(false)
const locked = ref(true)
const inp = ref<HTMLInputElement>()
let word = ''

function next() {
  if (round.value === 8) {
    emit('finish', score.value)
    return
  }
  shownRound.value = round.value + 1
  word = pick(pools[minPool + Math.floor((round.value * (maxPool - minPool + 1)) / 8)]!)
  shown.value = word.toUpperCase()
  answer.value = ''
  locked.value = true
  ok.value = false
  fb.value = 'Memorise it'
  later(
    async () => {
      shown.value = '• • •'
      locked.value = false
      fb.value = 'Now type it backwards'
      await nextTick()
      inp.value?.focus()
    },
    showMs + word.length * letterMs
  )
}
function onEnter() {
  if (locked.value) return
  const want = word.split('').reverse().join('')
  if (answer.value.trim().toLowerCase() === want) {
    score.value++
    ok.value = true
    fb.value = `Correct: ${want}`
    cheer()
  } else {
    ok.value = false
    fb.value = `It was ${want}. Next one!`
  }
  locked.value = true
  round.value++
  later(next, 1200)
}
onMounted(next)
</script>
