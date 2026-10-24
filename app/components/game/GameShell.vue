<template>
  <div
    class="mx-auto grid h-[calc(100dvh_-_var(--nav-h)_-_env(safe-area-inset-top,0px)_-_env(safe-area-inset-bottom,0px))] min-h-[560px] max-w-page grid-cols-[minmax(0,1fr)_340px] gap-4 px-5 py-4 max-xl:h-auto max-xl:grid-cols-[1fr] max-md:gap-3 max-md:px-3 max-md:py-2.5"
    data-testid="game-page"
    :style="tintVars(game.category)"
  >
    <section
      class="relative flex min-h-0 flex-col overflow-hidden rounded-[26px] border border-line bg-surface max-xl:min-h-[calc(100dvh_-_var(--nav-h)_-_32px)] max-md:min-h-[calc(100dvh_-_var(--nav-h)_-_92px_-_env(safe-area-inset-top,0px)_-_env(safe-area-inset-bottom,0px))] max-md:rounded-[20px]"
    >
      <div
        class="flex items-center gap-3 border-b border-b-line px-[18px] py-3.5 max-md:gap-2.5 max-md:px-3 max-md:py-2.5"
      >
        <NuxtLink to="/games" class="iconbtn" aria-label="Back to games"
          ><Icon name="bg:nav-back" size="20"
        /></NuxtLink>
        <span
          class="grid size-[46px] place-items-center rounded-icon bg-tint-bg max-md:size-10 [&_svg]:size-8 max-md:[&_svg]:size-7"
          data-testid="game-icon"
          ><GameIcon :game="game"
        /></span>
        <div>
          <h1 class="m-0 font-display text-[26px] leading-none font-extrabold max-md:text-[21px]">{{ game.name }}</h1>
          <small class="text-muted max-md:hidden"
            >{{ game.category }} · {{ game.level }} · trains {{ game.trains.toLowerCase() }}</small
          >
        </div>
        <div class="ml-auto text-right text-[13px] text-muted" data-testid="pb">
          <b class="block font-display text-[20px] leading-none font-bold text-ink">{{ best ?? '—' }}</b
          >your best
        </div>
      </div>
      <div
        class="relative flex flex-1 flex-col justify-center overflow-auto px-[clamp(16px,3vw,36px)] py-[22px] max-md:justify-start max-md:px-3 max-md:py-3.5"
      >
        <div
          v-for="c in cheers"
          :key="c.id"
          class="pointer-events-none absolute top-6 left-1/2 z-3 mx-auto w-full max-w-[760px] [transform:translateX(-50%)] animate-[pop_1.1s_ease-out_forwards] font-display text-[26px] leading-[normal] font-extrabold text-accent max-md:top-2 max-md:text-[22px]"
          data-testid="cheer"
        >
          {{ c.text }}
        </div>
        <div class="mx-auto w-full max-w-[760px]">
          <ReadyScreen v-if="phase === 'ready'" :game="game" @start="start" />
          <component :is="gameComponent" v-else-if="phase === 'playing'" :key="round" :game="game" @finish="finish" />
          <ResultScreen v-else :game="game" :score="score" :result="result!" @again="start" />
        </div>
      </div>
    </section>
    <GameSidebar :game="game" :here="here" />
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
import { gameComponents } from '~/components/games/registry'
const props = defineProps<{ game: GameDef }>()
const { tintVars } = useGames()
const { progress, record } = useProgress()
const { cheers } = useCheer()

type Phase = 'ready' | 'playing' | 'result'
const phase = ref<Phase>('ready')
const round = ref(0)
const score = ref(0)
const result = ref<ReturnType<typeof record>>()
const best = computed(() => progress.value.best[props.game.id])
const here = computed(() =>
  phase.value === 'result' && result.value
    ? result.value.band
    : best.value != null
      ? bandIndex(props.game, best.value)
      : -1
)
const gameComponent = computed(() => gameComponents[props.game.component] ?? gameComponents.ComingSoon)

function start() {
  round.value++
  phase.value = 'playing'
}
function finish(s: number) {
  score.value = s
  result.value = record(props.game, s)
  phase.value = 'result'
}
</script>
