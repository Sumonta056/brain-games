<template>
  <NuxtLink
    :to="`/games/${game.id}`"
    class="tile"
    :class="size !== 'normal' && size"
    :style="tintVars(game.category)"
    :aria-label="`${game.name}: ${game.blurb}`"
  >
    <svg
      class="ghost-ic"
      :viewBox="game.icon.viewBox"
      :style="{ color: fg(game.category) }"
      aria-hidden="true"
      v-html="game.icon.svg"
    />
    <div class="row1">
      <span class="ic"><GameIcon :game="game" /></span><span class="lv">{{ game.level }}</span>
    </div>
    <span class="nm">{{ game.name }}</span>
    <span class="bl">{{ game.blurb }}</span>
    <span class="bst">{{ bestText }}</span>
    <span v-if="size === 'big'" class="play">Play now</span>
  </NuxtLink>
</template>
<script setup lang="ts">
import type { GameDef, TileSize } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef; size: TileSize }>()
const { tintVars, fg } = useGames()
const { progress } = useProgress()
const bestText = computed(() => {
  const b = progress.value.best[props.game.id]
  return b != null
    ? `Best ${b} ${props.game.unit} · ${props.game.bands[bandIndex(props.game, b)]!.label}`
    : `${props.game.category} · not played yet`
})
</script>
<style scoped>
.tile {
  text-decoration: none;
}
</style>
