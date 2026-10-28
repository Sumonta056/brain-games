<template>
  <div class="mb-3.5 rounded-card border border-line bg-surface p-5" data-testid="brain">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="m-0 font-display text-[21px] leading-[1.2] font-bold">{{ p.brainTitle }}</h2>
        <p class="mt-0.5 mb-0 text-[14px] text-muted" data-testid="brain-caption">
          {{ played ? fill(p.brainCaption, { lit, total, played }) : p.brainEmpty }}
        </p>
      </div>
      <span
        class="rounded-pill bg-lilac-bg px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-lilac-fg"
        data-testid="brain-stage"
        >{{ stage }}</span
      >
    </div>
    <div
      class="relative mt-2 aspect-[400/280] w-full rounded-[20px] [background:radial-gradient(ellipse_at_45%_45%,var(--glow),transparent_70%)]"
      aria-hidden="true"
    >
      <i
        v-for="(l, i) in links"
        :key="`l${i}`"
        class="absolute h-[1.5px] origin-[0_50%] rounded-[2px] bg-line data-[state=lit]:bg-accent-2/55"
        :class="
          l.spark &&
          '[container-type:inline-size] after:absolute after:top-[-2.5px] after:left-0 after:size-1.5 after:[animation:spark-run_var(--d)_linear_var(--dl)_infinite] after:rounded-[50%] after:bg-accent after:shadow-[0_0_8px_2px_var(--accent)] after:content-[\'\']'
        "
        :style="l.style"
        :data-state="l.lit ? 'lit' : undefined"
        data-testid="link"
      />
      <i
        v-for="(n, i) in brain.neurons"
        :key="`n${i}`"
        class="absolute -translate-1/2 rounded-[50%] bg-line data-[state=lit]:[animation:neuron-pulse_3.2s_ease-in-out_var(--dl)_infinite] data-[state=new]:[animation:neuron-born_1s_ease-out_both,neuron-pulse_3.2s_ease-in-out_1s_infinite] [&:is([data-state=lit],[data-state=new])]:shadow-[0_0_0_3px_var(--glow)] [&:is([data-state=lit],[data-state=new])]:[background:linear-gradient(140deg,var(--accent-2),var(--accent))]"
        :style="{
          left: pct(n.x, brain.width),
          top: pct(n.y, brain.height),
          width: pct(n.s, brain.width),
          aspectRatio: '1',
          '--dl': `${(i * 0.29) % 3.2}s`
        }"
        :data-state="i < lit - 1 ? 'lit' : i === lit - 1 ? 'new' : undefined"
        data-testid="neuron"
      />
    </div>
    <div class="mt-3 flex items-center gap-3">
      <div class="h-2 flex-1 overflow-hidden rounded-pill bg-raise">
        <i
          class="block h-full rounded-pill [background:linear-gradient(90deg,var(--accent-2),var(--accent))]"
          :style="{ width: (lit / total) * 100 + '%' }"
        />
      </div>
      <small class="text-[13px] text-muted" data-testid="brain-next">
        {{ lit >= total ? p.brainDone : fill(p.brainNext, { n: played ? 2 - (played % 2) : 1 }) }}
      </small>
    </div>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
import brain from '~/data/brain.json'
const p = copy.profile
const total = brain.neurons.length
const { progress } = useProgress()
const played = computed(() => progress.value.played ?? progress.value.hist.length)
const lit = computed(() => litNeurons(played.value, total))
const stage = computed(() => [...p.brainStages].reverse().find(s => s.at <= played.value)!.label)
const pct = (v: number, of: number) => `${(v / of) * 100}%`
const links = computed(() =>
  brain.links.map(([a, b], i) => {
    const A = brain.neurons[a!]!
    const B = brain.neurons[b!]!
    const on = b! < lit.value
    return {
      lit: on,
      spark: on && i % 3 === 0,
      style: {
        left: pct(A.x, brain.width),
        top: pct(A.y, brain.height),
        width: pct(Math.hypot(B.x - A.x, B.y - A.y), brain.width),
        transform: `rotate(${Math.atan2(B.y - A.y, B.x - A.x)}rad)`,
        '--d': `${1.6 + (i % 5) * 0.4}s`,
        '--dl': `${(i * 0.37) % 3}s`
      }
    }
  })
)
</script>
