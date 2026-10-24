<template>
  <NuxtLink
    :to="`/games/${game.id}`"
    class="group relative flex cursor-pointer flex-col gap-1 overflow-hidden rounded-card border-none bg-tint-bg px-[18px] py-4 text-left text-ink no-underline [transition:transform_0.15s_ease,box-shadow_0.15s_ease] data-[size=big]:[grid-column:span_2] data-[size=big]:[grid-row:span_2] data-[size=big]:mt-3 data-[size=big]:mb-[18px] data-[size=big]:min-h-[1em] data-[size=big]:p-6 data-[size=big]:text-center data-[size=big]:font-display data-[size=big]:text-[length:clamp(56px,10vw,110px)] data-[size=big]:leading-[1.02] data-[size=big]:font-extrabold data-[size=big]:tracking-[-0.01em] data-[size=big]:[word-break:break-word] data-[size=tall]:[grid-row:span_2] data-[size=wide]:[grid-column:span_2] max-md:rounded-btn max-md:p-3.5 max-md:data-[size=big]:mt-2 max-md:data-[size=big]:mb-3.5 max-md:data-[size=big]:p-[18px] max-md:data-[size=big]:text-[length:clamp(46px,15vw,76px)] [&:hover]:[transform:translateY(-3px)] [&:hover]:[box-shadow:0_10px_24px_-14px_var(--tfg)]"
    data-testid="tile"
    :data-size="size === 'normal' ? undefined : size"
    :style="tintVars(game.category)"
    :aria-label="`${game.name}: ${game.blurb}`"
  >
    <GameIcon
      :game="game"
      class="pointer-events-none absolute -right-6 -bottom-6 size-[150px] opacity-[0.14] group-data-[size=big]:-right-10 group-data-[size=big]:-bottom-10 group-data-[size=big]:size-[260px]"
      data-testid="ghost-icon"
    />
    <div class="flex items-start justify-between gap-2">
      <span
        class="grid size-11 flex-none place-items-center rounded-icon bg-surface group-data-[size=big]:size-[60px] group-data-[size=big]:rounded-btn [&_svg]:size-[30px] group-data-[size=big]:[&_svg]:size-[42px]"
        data-testid="tile-icon"
        ><GameIcon :game="game" /></span
      ><span class="rounded-pill bg-surface px-2.5 py-0.5 text-[12px] font-semibold text-tint-fg">{{
        game.level
      }}</span>
    </div>
    <span
      class="mt-auto font-display text-[20px] leading-[1.1] font-bold group-data-[size=big]:text-[34px] max-md:text-[18px] max-md:group-data-[size=big]:text-[28px]"
      >{{ game.name }}</span
    >
    <span
      class="hidden text-[13.5px] leading-[1.4] text-muted group-data-[size=big]:block group-data-[size=big]:max-w-[30ch] group-data-[size=big]:text-[16px] group-data-[size=tall]:block group-data-[size=wide]:block"
      >{{ game.blurb }}</span
    >
    <span class="text-[12.5px] font-semibold text-tint-fg">{{ bestText }}</span>
    <span
      v-if="size === 'big'"
      class="relative mt-3 flex min-h-0 flex-col self-start overflow-hidden rounded-pill border border-line bg-tint-fg px-[18px] py-2 font-display text-[16px] leading-[normal] font-bold text-surface max-xl:min-h-[calc(100dvh_-_var(--nav-h)_-_32px)] max-md:min-h-[calc(100dvh_-_var(--nav-h)_-_92px_-_env(safe-area-inset-top,0px)_-_env(safe-area-inset-bottom,0px))]"
      >Play now</span
    >
  </NuxtLink>
</template>
<script setup lang="ts">
import type { GameDef, TileSize } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef; size: TileSize }>()
const { tintVars } = useGames()
const { progress } = useProgress()
const bestText = computed(() => {
  const b = progress.value.best[props.game.id]
  return b != null
    ? `Best ${b} ${props.game.unit} · ${props.game.bands[bandIndex(props.game, b)]!.label}`
    : `${props.game.category} · not played yet`
})
</script>
