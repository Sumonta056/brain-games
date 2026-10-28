<template>
  <div
    v-if="fav"
    class="mb-3.5 flex items-center gap-3.5 rounded-[20px] border border-line bg-surface px-4 py-3 [&_svg]:size-[34px]"
    :style="tintVars(fav.game.category)"
    data-testid="favourite"
  >
    <div class="grid size-12 flex-none place-items-center rounded-[14px] bg-tint-bg">
      <GameIcon :game="fav.game" />
    </div>
    <div class="min-w-0 flex-1">
      <small class="block text-[12px] tracking-[0.06em] text-muted uppercase">{{ copy.profile.favourite }}</small>
      <b class="font-display text-[20px]">{{ fav.game.name }}</b>
    </div>
    <span class="rounded-pill bg-tint-bg px-3 py-1.5 text-[13px] whitespace-nowrap text-tint-fg max-sm:hidden">
      {{ fill(copy.profile.favouriteCount, { n: fav.count }) }}
    </span>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
const { progress } = useProgress()
const { byId, tintVars } = useGames()
const fav = computed(() => {
  const top = favourite(progress.value.hist)
  const game = top && byId(top.id)
  return game ? { game, count: top.count } : null
})
</script>
