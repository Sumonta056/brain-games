<template>
  <!-- icon.svg is trusted, repo-owned markup from app/data/games/*.json -->
  <svg :viewBox="game.icon.viewBox" :style="{ color: fg(game.category) }" aria-hidden="true" v-html="game.icon.svg" />
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef }>()
const { fg } = useGames()
</script>
