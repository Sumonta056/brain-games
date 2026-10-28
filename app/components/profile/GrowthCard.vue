<template>
  <div class="mt-3.5 rounded-card border border-line bg-surface p-5" data-testid="growth">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="m-0 font-display text-[21px] leading-[1.2] font-bold">{{ p.growthTitle }}</h2>
      <span
        v-if="series.end != null"
        class="rounded-pill bg-mint-bg px-3 py-1 text-[13px] font-semibold text-mint-fg"
        data-testid="growth-gain"
      >
        {{ fill(p.growthGain, { n: series.end - (series.start ?? series.end), month: monthName }) }}
      </span>
    </div>
    <p v-if="series.end == null" class="mt-3 mb-0 p-4 text-center text-muted" data-testid="growth-empty">
      {{ p.growthEmpty }}
    </p>
    <div v-else class="mt-3.5 grid grid-cols-[auto_1fr] gap-2.5">
      <div class="flex flex-col justify-between pb-[22px] text-right text-[12px] text-muted">
        <span>{{ top }}</span
        ><span>{{ series.start }}</span>
      </div>
      <div>
        <div
          class="flex h-[150px] items-end border-b border-line [background:repeating-linear-gradient(to_top,transparent_0_49px,var(--line)_49px_50px)]"
        >
          <i
            v-for="c in cols"
            :key="c.date"
            class="relative min-h-[3px] flex-1 data-[state=up]:after:absolute data-[state=up]:after:top-[-6px] data-[state=up]:after:left-1/2 data-[state=up]:after:-ml-[4.5px] data-[state=up]:after:size-[9px] data-[state=up]:after:rounded-[50%] data-[state=up]:after:border-2 data-[state=up]:after:border-mint-fg data-[state=up]:after:bg-surface data-[state=up]:after:content-[''] max-sm:data-[state=up]:after:hidden"
            :class="
              c.value == null
                ? 'border-t-2 border-dashed border-line'
                : 'border-t-[3px] border-mint-fg [background:linear-gradient(to_top,color-mix(in_srgb,var(--mint-fg)_18%,transparent),color-mix(in_srgb,var(--mint-fg)_45%,transparent))]'
            "
            :style="{ height: c.height }"
            :title="c.value == null ? undefined : `${c.day}: ${c.value}`"
            :data-value="c.value ?? ''"
            :data-state="c.up ? 'up' : undefined"
            data-testid="growth-col"
          />
        </div>
        <div class="mt-1.5 flex justify-between text-[12px] text-muted">
          <span v-for="t in ticks" :key="t">{{ t }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
const props = defineProps<{ month: string }>()
const p = copy.profile
const { progress } = useProgress()
const fmt = (date: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' })
const series = computed(() => growthSeries(progress.value.xpDays ?? {}, props.month, todayKey()))
const monthName = computed(() => fmt(`${props.month}-01`, { month: 'long' }))
const top = computed(() => Math.max(series.value.end ?? 0, (series.value.start ?? 0) + 10))
const dates = computed(() => monthGrid(props.month).dates)
const ticks = computed(() =>
  [dates.value[0]!, dates.value[Math.ceil(dates.value.length / 2) - 1]!, dates.value.at(-1)!].map(d =>
    fmt(d, { month: 'short', day: 'numeric' })
  )
)
const cols = computed(() => {
  const lo = series.value.start ?? 0
  let prev = series.value.start
  return series.value.values.map((value, i) => {
    const up = value != null && prev != null && value > prev
    if (value != null) prev = value
    const date = dates.value[i]!
    return {
      date,
      value,
      up,
      day: fmt(date, { month: 'short', day: 'numeric' }),
      height: value == null ? '4%' : `${4 + ((value - lo) / (top.value - lo)) * 92}%`
    }
  })
})
</script>
