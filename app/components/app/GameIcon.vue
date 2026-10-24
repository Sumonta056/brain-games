<template>
  <Icon :name="`bg:games-${game.icon}`" :style="{ color: fg(game.category) }" width="unset" height="unset" />
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef }>()
const { fg } = useGames()
</script>
