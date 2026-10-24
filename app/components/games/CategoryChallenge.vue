<template>
  <ListGame :title="category" :seconds="game.durationSec ?? 60" :check="check" @finish="emit('finish', $event)" />
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const category = pick(gameContent(props.game, 'categories'))
const check = (w: string) => (w.length < 2 ? 'A little longer, please' : null)
</script>
