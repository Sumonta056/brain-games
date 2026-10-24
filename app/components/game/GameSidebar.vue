<template>
  <aside class="flex min-h-0 flex-col gap-3 overflow-auto max-xl:overflow-visible">
    <div :class="box">
      <h2 :class="head"><i class="size-2 rounded-[50%] bg-accent" />How to play</h2>
      <ol class="m-0 list-none p-0 [counter-reset:s]">
        <li
          v-for="s in game.steps"
          :key="s"
          class="mb-2 flex items-start gap-2.5 text-[14.5px] [counter-increment:s] before:grid before:size-6 before:flex-none before:place-items-center before:rounded-[50%] before:bg-tint-bg before:font-display before:text-[14px] before:leading-[normal] before:font-bold before:text-tint-fg before:content-[counter(s)]"
        >
          {{ s }}
        </li>
      </ol>
    </div>
    <div :class="box">
      <h2 :class="head"><i class="size-2 rounded-[50%] bg-accent" />What your score means</h2>
      <div class="flex flex-col gap-[3px]" data-testid="bands">
        <div
          v-for="(b, i) in game.bands"
          :key="b.label"
          class="flex justify-between gap-2.5 rounded-[10px] px-3 py-[7px] text-[14px] text-muted aria-[current=true]:bg-rose-bg aria-[current=true]:font-semibold aria-[current=true]:text-rose-fg aria-[current=true]:after:ml-1.5 aria-[current=true]:after:rounded-pill aria-[current=true]:after:bg-accent aria-[current=true]:after:px-2 aria-[current=true]:after:py-px aria-[current=true]:after:font-display aria-[current=true]:after:text-[11px] aria-[current=true]:after:leading-[normal] aria-[current=true]:after:font-bold aria-[current=true]:after:text-on-accent aria-[current=true]:after:content-['you']"
          :aria-current="i === here ? 'true' : undefined"
        >
          <span>{{ b.label }}</span
          ><span class="ml-auto">{{ b.range }}</span>
        </div>
      </div>
      <p class="mx-0 mt-2 mb-0 text-[13.5px] text-muted">
        {{ game.lowerIsBetter ? 'Lower is better. ' : ''
        }}{{ here >= 0 ? 'Highlighted: where your score sits.' : 'Play once to see where you land.' }}
      </p>
    </div>
    <div :class="box">
      <h2 :class="head"><i class="size-2 rounded-[50%] bg-accent" />The science</h2>
      <p class="m-0 text-[13.5px] text-muted">
        {{ game.science }}<br /><br /><b class="font-semibold text-ink">Tip:</b> {{ game.tip }}
      </p>
    </div>
  </aside>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef; here: number }>()
const box = 'rounded-[20px] border border-line bg-surface px-[18px] py-4 max-md:rounded-btn max-md:px-4 max-md:py-3.5'
const head = 'mx-0 mt-0 mb-2.5 flex items-center gap-2 font-display text-[18px] leading-[normal] font-bold'
</script>
