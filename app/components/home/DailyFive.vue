<template>
  <div class="relative flex flex-wrap items-center gap-3 max-md:gap-2">
    <span class="font-display text-[15px] leading-[normal] font-bold" data-testid="daily-label">{{
      done === 5 ? 'Today’s five: all done 🌸' : `Today’s five · ${done}/5`
    }}</span>
    <NuxtLink
      v-for="g in five"
      :key="g.id"
      :to="`/games/${g.id}`"
      class="flex cursor-pointer items-center gap-1.5 rounded-pill border border-line bg-raise py-1 pr-3 pl-1 text-[14px] text-inherit no-underline data-[state=done]:opacity-55 max-md:text-[13px] data-[state=done]:[&_span]:line-through [&_svg]:size-6"
      :data-state="playedToday(g.id) ? 'done' : undefined"
    >
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
