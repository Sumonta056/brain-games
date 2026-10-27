<template>
  <ListGame
    :title="`Words starting with ${letter}`"
    :seconds="game.durationSec ?? 60"
    :check="check"
    @finish="emit('finish', $event)"
  />
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const letter = pick(gameContent(props.game, 'letters'))
const words = await loadWordList(letter).catch(() => null)

function check(w: string) {
  if (!/^[a-z'-]+$/.test(w)) return 'Letters only, please'
  if (w.length < 3) return 'Try 3 letters or more'
  if (w[0] !== letter.toLowerCase()) return `That one needs to start with ${letter}`
  if (words && !words.has(w)) return 'I do not know that one yet. Try another'
  return null
}
</script>
