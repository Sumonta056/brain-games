<template>
  <div class="mt-3.5 rounded-card border border-line bg-surface p-5">
    <div class="mb-3.5 flex items-center justify-between gap-2">
      <h2 class="m-0 font-display text-[21px] leading-[1.2] font-bold" data-testid="month-title">{{ title }}</h2>
      <div class="flex gap-1.5">
        <button
          ref="prevBtn"
          :class="navBtn"
          :aria-label="p.prevMonth"
          :disabled="prevOff"
          @click="emit('update:month', shiftMonth(month, -1))"
        >
          {{ p.prevGlyph }}
        </button>
        <button
          ref="nextBtn"
          :class="navBtn"
          :aria-label="p.nextMonth"
          :disabled="nextOff"
          @click="emit('update:month', shiftMonth(month, 1))"
        >
          {{ p.nextGlyph }}
        </button>
      </div>
    </div>
    <div class="grid grid-cols-[minmax(0,1fr)_220px] items-start gap-[22px] max-lg:grid-cols-[1fr]">
      <div>
        <div class="grid grid-cols-[repeat(7,1fr)] gap-1.5 text-center max-sm:gap-1">
          <div v-for="d in p.weekdays" :key="d" class="pb-0.5 text-[12px] text-muted">{{ d }}</div>
          <div v-for="i in grid.offset" :key="`b${i}`" />
          <div
            v-for="(d, i) in grid.dates"
            :key="d"
            class="grid h-11 place-items-center rounded-[12px] bg-raise text-[14px] text-muted data-today:shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--accent)] data-[state=future]:border data-[state=future]:border-dashed data-[state=future]:border-line data-[state=future]:bg-transparent data-[state=future]:opacity-70 data-[state=on]:font-semibold data-[state=on]:text-on-accent data-[state=on]:[background:linear-gradient(140deg,var(--accent-2),var(--accent))] max-sm:h-10"
            :data-state="playedSet.has(d) ? 'on' : d > today ? 'future' : undefined"
            :data-today="d === today ? '' : undefined"
            :aria-label="`${label(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}, ${playedSet.has(d) ? p.played : p.rest}`"
            role="img"
            data-testid="day"
          >
            {{ i + 1 }}
          </div>
        </div>
        <div class="mt-3 flex gap-3.5 text-[12px] text-muted" data-testid="month-legend">
          <span class="flex items-center gap-1.5"
            ><i class="size-3 rounded-[4px] [background:linear-gradient(140deg,var(--accent-2),var(--accent))]" />{{
              p.legendPlayed
            }}</span
          >
          <span class="flex items-center gap-1.5"><i class="size-3 rounded-[4px] bg-raise" />{{ p.legendRest }}</span>
        </div>
      </div>
      <div class="grid gap-2.5 max-lg:grid-cols-[repeat(3,1fr)] max-sm:gap-1.5" data-testid="month-summary">
        <div v-for="s in summary" :key="s.label" class="rounded-[16px] bg-raise px-3.5 py-3 max-sm:p-2.5">
          <b class="block font-display text-[26px] leading-none max-sm:text-[20px]">{{ s.value }}</b>
          <span class="text-[13px] text-muted">{{ s.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
const props = defineProps<{ month: string }>()
const emit = defineEmits<{ 'update:month': [month: string] }>()
const p = copy.profile
const { progress } = useProgress()
const today = todayKey()
const current = today.slice(0, 7)
const label = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' })
const grid = computed(() => monthGrid(props.month))
const playedSet = computed(() => new Set(progress.value.days))
const title = computed(() => label(`${props.month}-01`, { month: 'long', year: 'numeric' }))
const oldest = computed(() => [...progress.value.days].sort()[0]?.slice(0, 7) ?? current)
const navBtn =
  'size-11 cursor-pointer rounded-[12px] border border-line bg-raise text-[20px] disabled:cursor-default disabled:opacity-35'
const prevBtn = useTemplateRef<HTMLButtonElement>('prevBtn')
const nextBtn = useTemplateRef<HTMLButtonElement>('nextBtn')
const prevOff = computed(() => props.month <= oldest.value)
const nextOff = computed(() => props.month >= current)
watch(
  [prevOff, nextOff],
  ([prev, next]) => {
    if (prev && document.activeElement === prevBtn.value) nextBtn.value?.focus()
    if (next && document.activeElement === nextBtn.value) prevBtn.value?.focus()
  },
  { flush: 'pre' }
)
const summary = computed(() => {
  const g = growthSeries(progress.value.xpDays ?? {}, props.month, today)
  const shown = props.month === current ? Number(today.slice(8)) : grid.value.dates.length
  return [
    {
      label: p.daysPlayed,
      value: fill(p.dayCount, { n: monthPlayed(progress.value.days, props.month), total: shown })
    },
    { label: p.pointsGrown, value: fill(p.gain, { n: g.end != null && g.start != null ? g.end - g.start : 0 }) },
    { label: p.bestDay, value: g.bestDay ? label(g.bestDay, { month: 'short', day: 'numeric' }) : p.none }
  ]
})
</script>
