<template>
  <div>
    <div class="bar"><i :style="{ width: fraction * 100 + '%' }" /></div>
    <div class="hud">
      <span>Tap the different tile</span><span>Score {{ lvl }}</span>
    </div>
    <div class="board max-w-[420px]" :style="{ gridTemplateColumns: `repeat(${n},1fr)` }">
      <button
        v-for="i in n * n"
        :key="`${lvl}-${i}`"
        class="cell"
        :class="{ 'outline-3 outline-bad outline-solid': missed.has(i - 1) }"
        aria-label="Tile"
        :data-state="missed.has(i - 1) ? 'miss' : undefined"
        :style="{ background: `hsl(${hue} ${sat}% ${i - 1 === odd ? li + d : li}%)` }"
        @click="tap(i - 1)"
      />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const lvl = ref(0)
const n = ref(2)
const odd = ref(0)
const hue = ref(0)
const sat = ref(0)
const li = ref(0)
const d = ref(0)
const missed = ref(new Set<number>())

function next() {
  n.value = Math.min(7, 2 + Math.floor(lvl.value / 3))
  hue.value = ri(0, 359)
  sat.value = ri(45, 70)
  li.value = ri(45, 62)
  d.value = Math.max(3, 22 - lvl.value * 0.8) * (Math.random() < 0.5 ? 1 : -1)
  odd.value = ri(0, n.value * n.value - 1)
  missed.value = new Set()
}
function tap(i: number) {
  if (i !== odd.value) {
    missed.value = new Set(missed.value).add(i)
    return
  }
  lvl.value++
  if (lvl.value % 4 === 0) cheer()
  next()
}
const { fraction, start } = useCountdown(props.game.durationSec ?? 60, () => emit('finish', lvl.value))
next()
onMounted(start)
</script>
