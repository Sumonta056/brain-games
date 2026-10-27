<template>
  <div>
    <div class="hud">
      <span>{{ want <= total ? `Find ${want}` : 'Done' }}</span
      ><span>{{ time }}</span>
    </div>
    <div class="board max-w-[460px]" :class="cols[size]" data-testid="board" :data-cols="size">
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
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const { later, every } = useTimeouts()
const size = setting(props.game, 'size')
const penaltySec = setting(props.game, 'penaltySec')
const total = size * size
const cols: Record<number, string> = { 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' }
const nums = shuffle(Array.from({ length: total }, (_, i) => i + 1))
const want = ref(1)
const miss = ref<number | null>(null)
const time = ref('0.0 s')
const t0 = performance.now()
const penalties = ref(0)
const elapsed = () => ((performance.now() - t0) / 1000 + penalties.value).toFixed(1)

function tap(num: number) {
  if (want.value > total) return
  if (num !== want.value) {
    miss.value = num
    if (num > want.value) penalties.value += penaltySec
    later(() => {
      if (miss.value === num) miss.value = null
    }, 250)
    return
  }
  want.value++
  if (want.value === Math.ceil(total / 2)) cheer('Halfway!')
  if (want.value > total) later(() => emit('finish', Number(elapsed())), 400)
}
every(() => {
  if (want.value <= total) time.value = `${elapsed()} s`
}, 100)
</script>
