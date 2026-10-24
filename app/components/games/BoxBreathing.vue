<template>
  <div>
    <div class="breath">
      <i :style="{ transform: `scale(${scale})` }" /><i class="b2" :style="{ transform: `scale(${scale})` }" />
      <span data-testid="breath-label">{{ phaseLabel }}<br v-if="count" />{{ count || '' }}</span>
    </div>
    <p class="note">{{ cycles }} of 4 rounds · {{ cycles < 4 ? 'beautiful' : 'done' }}</p>
    <div class="row"><button class="ghost" @click="emit('finish', cycles)">Finish early</button></div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { later } = useTimeouts()
const PHASES = [
  ['Breathe in', 1],
  ['Hold', 1],
  ['Breathe out', 0.45],
  ['Hold', 0.45]
] as const
const step = ref(0)
const count = ref(0)
const cycles = ref(0)
const scale = ref(0.45)
const phaseLabel = ref('Get ready')

function run() {
  if (step.value === 16) {
    emit('finish', 4)
    return
  }
  const [label, s] = PHASES[step.value % 4]!
  phaseLabel.value = label
  scale.value = s
  count.value = 4
  for (let k = 1; k < 4; k++)
    later(() => {
      count.value = 4 - k
    }, k * 1000)
  later(() => {
    step.value++
    if (step.value % 4 === 0) cycles.value++
    run()
  }, 4000)
}
onMounted(() => later(run, 1200))
</script>
