<template>
  <section
    class="mb-[18px] grid grid-cols-[1.6fr_1fr] gap-3.5 max-lg:grid-cols-[1fr] max-md:mb-3 max-md:gap-2.5"
    data-testid="hero"
  >
    <div
      class="relative overflow-hidden rounded-card border border-line bg-surface px-[22px] py-5 max-md:rounded-btn max-md:p-4"
      data-testid="hero-card"
    >
      <Icon
        name="bg:brand-neurons"
        class="pointer-events-none absolute -top-2.5 -right-2.5 w-[230px] opacity-55 max-md:w-[140px] max-md:opacity-35"
        data-testid="neurons"
        width="unset"
        height="unset"
      />
      <h1 class="m-0 font-display text-[length:clamp(28px,4vw,40px)] leading-[1.05] font-extrabold">
        {{ greeting }}{{ progress.name ? ', ' + progress.name : '' }}
      </h1>
      <p class="mx-0 mt-1.5 mb-3.5 text-muted" data-testid="affirmation">{{ affirmation }}</p>
      <DailyFive />
    </div>
    <MoodCheck />
  </section>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
const { progress } = useProgress()
const affirmation = copy.affirmations[dayNum() % copy.affirmations.length]
const hr = new Date().getHours()
const greeting = copy.greetings.find(g => hr < g.before)!.text
</script>
