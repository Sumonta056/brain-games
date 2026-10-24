<template>
  <div class="daily">
    <span class="lbl">{{ done === 5 ? 'Today’s five: all done 🌸' : `Today’s five · ${done}/5` }}</span>
    <NuxtLink v-for="g in five" :key="g.id" :to="`/games/${g.id}`" class="dpick" :class="{ done: playedToday(g.id) }">
      <GameIcon :game="g" /><span>{{ g.name }}</span>
    </NuxtLink>
  </div>
</template>
<script setup lang="ts">
const { todaysFive } = useGames()
const { playedToday } = useProgress()
const five = todaysFive()
const done = computed(() => five.filter(g => playedToday(g.id)).length)
</script>
<style scoped>
.dpick {
  color: inherit;
  text-decoration: none;
}
</style>
