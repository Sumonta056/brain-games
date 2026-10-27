<template>
  <section>
    <div id="games" class="mx-0 mt-1.5 mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 class="m-0 font-display text-[26px] leading-none font-extrabold max-md:text-[22px]">{{ title }}</h2>
      <div
        class="flex flex-wrap gap-1.5 max-md:w-full max-md:[scrollbar-width:none] max-md:flex-nowrap max-md:overflow-x-auto max-md:pb-1"
        data-testid="chips"
      >
        <button
          v-for="c in filters"
          :key="c"
          class="cursor-pointer rounded-pill border border-line bg-surface px-3.5 py-1.5 text-[14px] text-muted aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg max-md:flex-none max-md:py-2"
          :aria-pressed="filter === c"
          @click="filter = c"
        >
          {{ c }}
        </button>
      </div>
    </div>
    <div
      class="grid grid-flow-dense auto-rows-[minmax(150px,auto)] grid-cols-4 gap-3 max-xl:grid-cols-3 max-md:gap-2.5 max-sm:auto-rows-[minmax(130px,auto)] max-sm:grid-cols-2"
    >
      <GameTile
        v-for="g in shown"
        :key="g.id"
        :game="g"
        :size="filter === 'All' ? g.size : g.size === 'big' ? 'wide' : 'normal'"
      />
    </div>
  </section>
</template>
<script setup lang="ts">
import type { Category } from '~~/shared/types/game'
withDefaults(defineProps<{ title?: string }>(), { title: 'Pick a game' })
const { games, categories } = useGames()
const filters = ['All', ...Object.keys(categories)] as ('All' | Category)[]
const filter = ref<'All' | Category>('All')
const shown = computed(() => (filter.value === 'All' ? games : games.filter(g => g.category === filter.value)))
</script>
