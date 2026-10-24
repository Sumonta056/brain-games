<template>
  <div>
    <div class="hud">
      <span>Find all 8 pairs</span><span>Moves {{ moves }}</span>
    </div>
    <div class="board max-w-[440px] grid-cols-4">
      <button
        v-for="(c, i) in cards"
        :key="i"
        class="card"
        :class="{ up: c.state !== 'down', got: c.state === 'got' }"
        data-testid="card"
        aria-label="Card"
        :data-state="c.state"
        @click="flip(i)"
      >
        <span v-if="c.state !== 'down'">{{ c.emoji }}</span>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const { later } = useTimeouts()
const emojis = shuffle(gameContent(props.game, 'emojis')).slice(0, 8)
const cards = ref(shuffle([...emojis, ...emojis]).map(emoji => ({ emoji, state: 'down' as 'down' | 'up' | 'got' })))
const moves = ref(0)
let open: number[] = []
let found = 0
let lock = false

function flip(i: number) {
  const c = cards.value[i]!
  if (lock || c.state !== 'down') return
  c.state = 'up'
  open.push(i)
  if (open.length < 2) return
  moves.value++
  const [a, b] = open.map(k => cards.value[k]!) as [typeof c, typeof c]
  open = []
  if (a.emoji === b.emoji) {
    a.state = b.state = 'got'
    found++
    cheer()
    if (found === 8) later(() => emit('finish', moves.value), 700)
  } else {
    lock = true
    later(() => {
      a.state = b.state = 'down'
      lock = false
    }, 800)
  }
}
</script>
