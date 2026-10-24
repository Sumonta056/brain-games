<template>
  <section>
    <div id="games" class="gh">
      <h2>{{ title }}</h2>
      <div class="chips">
        <button v-for="c in filters" :key="c" class="chip" :aria-pressed="filter === c" @click="filter = c">
          {{ c }}
        </button>
      </div>
    </div>
    <div class="bento">
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
