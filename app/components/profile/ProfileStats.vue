<template>
  <div class="mb-3 grid grid-cols-[repeat(4,1fr)] gap-3 max-sm:grid-cols-[1fr_1fr] max-sm:gap-2">
    <div
      v-for="t in tiles"
      :key="t.label"
      class="flex flex-col gap-0.5 rounded-[20px] px-4 pt-3.5 pb-3"
      :class="t.bg"
      data-testid="stat"
    >
      <span class="text-[13px] font-medium" :class="t.fg">{{ t.label }}</span>
      <b class="block font-display text-[34px] leading-[1.05] font-extrabold max-sm:text-[26px]">{{ t.value }}</b>
      <div v-if="t.meter != null" class="mt-2 h-1.5 overflow-hidden rounded-pill bg-surface">
        <i class="block h-full rounded-pill bg-sky-fg" :style="{ width: t.meter + '%' }" data-testid="stat-meter" />
      </div>
      <span class="text-[13px] text-muted" data-testid="stat-sub"
        ><template v-for="(part, i) in t.sub" :key="i"
          ><b v-if="part.value" class="font-semibold text-ink">{{ part.text }}</b
          ><template v-else>{{ part.text }}</template></template
        ></span
      >
    </div>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
const s = copy.profile.stats
const { progress, streak } = useProgress()
const { games } = useGames()
const tiles = computed(() => {
  const p = progress.value
  const month = todayKey().slice(0, 7)
  const inMonth = monthPlayed(p.days, month)
  const tried = new Set(Object.keys(p.best).map(k => k.split('@')[0])).size
  return [
    {
      label: s.streak,
      value: streak.value,
      sub: fillParts(s.best, { n: Math.max(bestStreak(p.days), streak.value) }),
      bg: 'bg-peach-bg',
      fg: 'text-peach-fg'
    },
    {
      label: s.played,
      value: p.played ?? p.hist.length,
      sub: fillParts(s.tried, { n: tried, total: games.length }),
      bg: 'bg-lilac-bg',
      fg: 'text-lilac-fg'
    },
    {
      label: s.month,
      value: fill(s.monthValue, { n: inMonth }),
      meter: (inMonth / monthGrid(month).dates.length) * 100,
      sub: [],
      bg: 'bg-sky-bg',
      fg: 'text-sky-fg'
    },
    {
      label: s.bests,
      value: Object.keys(p.best).length,
      sub: fillParts(s.mastered, { n: p.mastered?.length ?? 0 }),
      bg: 'bg-sun-bg',
      fg: 'text-sun-fg'
    }
  ]
})
</script>
