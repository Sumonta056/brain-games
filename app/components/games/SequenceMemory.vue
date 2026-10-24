<template>
  <div>
    <div class="hud">
      <span>Level {{ seq.length }}</span
      ><span>Score {{ score }}</span>
    </div>
    <div class="board grid-cols-3">
      <button
        v-for="i in 9"
        :key="i"
        class="cell"
        :class="{ on: lit.has(i - 1), miss: missAt === i - 1 }"
        :aria-label="`Square ${i}`"
        :data-state="missAt === i - 1 ? 'miss' : lit.has(i - 1) ? 'on' : undefined"
        @click="tap(i - 1)"
      />
    </div>
    <p class="note">{{ fb }}</p>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const { later } = useTimeouts()
const seq = ref<number[]>([])
const lit = ref(new Set<number>())
const missAt = ref<number | null>(null)
const score = ref(0)
const fb = ref('')
let pos = 0
let input = false

const light = (k: number, on: boolean) => {
  const s = new Set(lit.value)
  if (on) s.add(k)
  else s.delete(k)
  lit.value = s
}
function level() {
  seq.value = [...seq.value, ri(0, 8)]
  pos = 0
  input = false
  fb.value = 'Watch…'
  seq.value.forEach((k, i) => {
    later(() => light(k, true), i * 650 + 500)
    later(() => light(k, false), i * 650 + 950)
  })
  later(
    () => {
      input = true
      fb.value = 'Your turn'
    },
    seq.value.length * 650 + 550
  )
}
function tap(i: number) {
  if (!input) return
  light(i, true)
  later(() => light(i, false), 180)
  if (i !== seq.value[pos]) {
    input = false
    missAt.value = i
    fb.value = 'Nice run!'
    later(() => emit('finish', seq.value.length - 1), 1000)
    return
  }
  pos++
  if (pos < seq.value.length) return
  input = false
  score.value = seq.value.length
  if (seq.value.length % 3 === 0) cheer()
  later(level, 700)
}
onMounted(level)
</script>
