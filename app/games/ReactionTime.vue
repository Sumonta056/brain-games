<template>
  <div>
    <div
      class="react"
      :class="{ go2: armed }"
      tabindex="0"
      @pointerdown="hit"
      @keydown.space.prevent="hit"
      @keydown.enter.prevent="hit"
    >
      {{ label }}
    </div>
    <p class="note">Round {{ Math.min(times.length + 1, 5) }} of 5</p>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { later, clearAll } = useTimeouts()
const times = ref<number[]>([])
const label = ref('Wait for green…')
const armed = ref(false)
let goAt = 0
let waiting = true

function arm() {
  waiting = true
  armed.value = false
  label.value = 'Wait for green…'
  goAt = 0
  later(
    () => {
      armed.value = true
      label.value = 'Tap!'
      goAt = performance.now()
    },
    ri(1200, 3800)
  )
}
function hit() {
  if (!waiting) return
  if (!goAt) {
    clearAll()
    waiting = false
    label.value = 'A little early! Let’s try that round again.'
    later(arm, 1100)
    return
  }
  const ms = Math.round(performance.now() - goAt)
  times.value.push(ms)
  waiting = false
  armed.value = false
  label.value = `${ms} ms ${ms < 250 ? '⚡' : '👍'}`
  if (times.value.length === 5) later(() => emit('finish', Math.round(times.value.reduce((a, b) => a + b) / 5)), 900)
  else later(arm, 1000)
}
onMounted(arm)
</script>
