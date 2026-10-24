<template>
  <div>
    <div class="bar"><i :style="{ width: fraction * 100 + '%' }" /></div>
    <div class="hud">
      <span>Tap the ink colour</span><span>Score {{ s }}</span>
    </div>
    <div class="big" data-testid="word" :style="{ color: `var(--${ink.token})` }">{{ word.name.toUpperCase() }}</div>
    <div class="colorbtns" data-testid="colour-buttons">
      <button v-for="c in colours" :key="c.token" :style="{ background: `var(--${c.token})` }" @click="tap(c)">
        {{ c.name }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
type Colour = { name: string; token: string }
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const colours = gameContent(props.game, 'colours')
const s = ref(0)
const word = ref<Colour>(colours[0]!)
const ink = ref<Colour>(colours[1]!)
let streak = 0

function next() {
  const w = pick(colours)
  let k: Colour
  do k = pick(colours)
  while (k === w)
  word.value = w
  ink.value = k
}
function tap(c: Colour) {
  if (c.token === ink.value.token) {
    s.value++
    streak++
    if (streak % 8 === 0) cheer()
  } else {
    s.value--
    streak = 0
  }
  next()
}
const { fraction, start } = useCountdown(props.game.durationSec ?? 45, () => emit('finish', Math.max(0, s.value)))
next()
onMounted(start)
</script>
