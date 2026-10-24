<template>
  <div>
    <div class="hud">
      <span>{{ want <= 25 ? `Find ${want}` : 'Done' }}</span
      ><span>{{ time }}</span>
    </div>
    <div class="board max-w-[460px] grid-cols-5">
      <button
        v-for="num in nums"
        :key="num"
        class="cell"
        :class="{ done: num < want, miss: miss === num }"
        :data-state="num < want ? 'done' : miss === num ? 'miss' : undefined"
        @click="tap(num)"
      >
        {{ num }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const { later, every } = useTimeouts()
const nums = shuffle(Array.from({ length: 25 }, (_, i) => i + 1))
const want = ref(1)
const miss = ref<number | null>(null)
const time = ref('0.0 s')
const t0 = performance.now()
const elapsed = () => ((performance.now() - t0) / 1000).toFixed(1)

function tap(num: number) {
  if (want.value > 25) return
  if (num !== want.value) {
    miss.value = num
    later(() => {
      if (miss.value === num) miss.value = null
    }, 250)
    return
  }
  want.value++
  if (want.value === 13) cheer('Halfway!')
  if (want.value > 25) later(() => emit('finish', Number(elapsed())), 400)
}
every(() => {
  if (want.value <= 25) time.value = `${elapsed()} s`
}, 100)
</script>
