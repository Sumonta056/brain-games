<template>
  <div>
    <div class="hud">
      <span>Letter {{ Math.min(N, Math.max(1, i + 1)) }} of {{ N }}</span
      ><span>Score {{ hits }}</span>
    </div>
    <div class="big" data-testid="letter">{{ shown }}</div>
    <div class="row"><button class="go" @click="press">Match</button></div>
    <p class="note" :class="{ ok }" data-testid="feedback" :data-state="ok ? 'ok' : undefined">{{ fb }}</p>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { later } = useTimeouts()
const N = 24
const n = setting(props.game, 'n')
const letters = gameContent(props.game, 'letters')
const seq: string[] = []
for (let k = 0; k < N; k++) {
  if (k >= n && Math.random() < 0.3) seq.push(seq[k - n]!)
  else {
    let l: string
    do l = pick(letters)
    while (k >= n && l === seq[k - n])
    seq.push(l)
  }
}
const pressed = new Array<boolean>(N).fill(false)
const i = ref(-1)
const hits = ref(0)
const shown = ref('')
const fb = ref(gameContent(props.game, 'hint').replace('{n}', String(n)))
const ok = ref(false)

function press() {
  const k = i.value
  if (k < n || pressed[k]) return
  pressed[k] = true
  ok.value = seq[k] === seq[k - n]
  fb.value = ok.value ? 'Match!' : 'Not this time'
  if (ok.value) hits.value++
}
function step() {
  i.value++
  if (i.value === N) {
    let right = 0
    for (let k = n; k < N; k++) if ((seq[k] === seq[k - n]) === pressed[k]) right++
    emit('finish', Math.round((right / (N - n)) * 100))
    return
  }
  shown.value = ''
  later(() => {
    shown.value = seq[i.value]!
    ok.value = false
    fb.value = ''
  }, 250)
  later(step, 2400)
}
const onKey = (e: KeyboardEvent) => {
  if (e.key !== ' ') return
  e.preventDefault()
  press()
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  step()
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
