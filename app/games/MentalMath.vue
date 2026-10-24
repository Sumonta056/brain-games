<template>
  <div>
    <div class="bar"><i :style="{ width: fraction * 100 + '%' }" /></div>
    <div class="hud">
      <span>Type the answer</span><span>Score {{ n }}</span>
    </div>
    <div class="big">{{ question }}</div>
    <input ref="inp" v-model="answer" class="field" inputmode="numeric" autocomplete="off" aria-label="Answer" />
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const n = ref(0)
const answer = ref('')
const question = ref('')
let cur = 0
const inp = ref<HTMLInputElement>()

function next() {
  const lvl = Math.min(3, Math.floor(n.value / 5))
  const op = pick(lvl ? ['+', '−', '×'] : ['+', '−'])
  let a: number, b: number
  if (op === '×') {
    a = ri(2, 9 + lvl * 3)
    b = ri(2, 9 + lvl)
  } else {
    a = ri(10 * (lvl + 1), 60 * (lvl + 1))
    b = ri(4, 40 * (lvl + 1))
    if (op === '−' && b > a) [a, b] = [b, a]
  }
  cur = op === '+' ? a + b : op === '−' ? a - b : a * b
  question.value = `${a} ${op} ${b}`
  answer.value = ''
}
watch(answer, v => {
  if (v.trim() !== '' && Number(v) === cur) {
    n.value++
    if (n.value % 5 === 0) cheer(n.value === 5 ? 'Level up!' : undefined)
    next()
  }
})
const { fraction, start } = useCountdown(props.game.durationSec ?? 60, () => emit('finish', n.value))
onMounted(() => {
  next()
  start()
  inp.value?.focus()
})
</script>
