<template>
  <div class="gpage" :style="tintVars(game.category)">
    <section class="play">
      <div class="phead">
        <NuxtLink to="/games" class="iconbtn" aria-label="Back to games"><NavIcon name="back" /></NuxtLink>
        <span class="gi"><GameIcon :game="game" /></span>
        <div>
          <h1>{{ game.name }}</h1>
          <small>{{ game.category }} · {{ game.level }} · trains {{ game.trains.toLowerCase() }}</small>
        </div>
        <div class="pb">
          <b>{{ best ?? '—' }}</b
          >your best
        </div>
      </div>
      <div class="pstage">
        <div v-for="c in cheers" :key="c.id" class="cheer">{{ c.text }}</div>
        <div>
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
import { gameComponents } from '~/games/registry'
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
