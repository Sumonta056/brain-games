<template>
  <div class="ready">
    <div>
      <h2>Ready?</h2>
      <p>{{ game.blurb }}. Watch the demo, then jump in.</p>
      <button ref="btn" class="go" @click="$emit('start')">Start ▸</button>
      <div class="kbd">or press <kbd>Enter</kbd></div>
    </div>
    <div class="demo">
      <div class="lab"><span>Quick demo</span><span>auto-plays</span></div>
      <!-- demo scenes are trusted repo-owned HTML from the game JSON -->
      <div class="scene" v-html="game.demo[frame]!.scene" />
      <div class="cap">{{ game.demo[frame]!.caption }}</div>
      <div class="dots"><i v-for="(_, i) in game.demo" :key="i" :class="{ on: i === frame }" /></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ start: [] }>()
const frame = ref(0)
const btn = ref<HTMLButtonElement>()
let t: ReturnType<typeof setInterval>
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('start')
  }
}
onMounted(() => {
  btn.value?.focus()
  t = setInterval(() => {
    frame.value = (frame.value + 1) % props.game.demo.length
  }, 2200)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  clearInterval(t)
  window.removeEventListener('keydown', onKey)
})
</script>
