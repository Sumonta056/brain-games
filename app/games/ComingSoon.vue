<template>
  <div class="center">
    <p class="mid">Coming soon</p>
    <p class="note">
      This game is not ported yet. Its logic is <code>RUN.{{ game.id }}</code> in docs/design.html.
    </p>
    <div class="row"><button class="go" @click="$emit('finish', 0)">Skip</button></div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef }>()
defineEmits<{ finish: [score: number] }>()
</script>
