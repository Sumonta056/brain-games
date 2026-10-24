<template>
  <section class="hero">
    <div class="hcard">
      <svg class="neurons" viewBox="0 0 240 160" aria-hidden="true">
        <g stroke="var(--accent-2)" stroke-width="1.5" fill="none" opacity=".7">
          <path d="M30 40 90 70 150 30 210 80M90 70 120 130 190 120 210 80M150 30 190 120" />
        </g>
        <g fill="var(--accent)">
          <circle cx="30" cy="40" r="6" />
          <circle cx="90" cy="70" r="8" />
          <circle cx="150" cy="30" r="5" />
          <circle cx="210" cy="80" r="7" />
          <circle cx="120" cy="130" r="5" />
          <circle cx="190" cy="120" r="6" />
        </g>
      </svg>
      <h1>{{ greeting }}{{ progress.name ? ', ' + progress.name : '' }}</h1>
      <p class="aff">{{ affirmation }}</p>
      <DailyFive />
    </div>
    <MoodCheck />
  </section>
</template>
<script setup lang="ts">
const { progress } = useProgress()
const AFFIRM = [
  'Small reps, every day. That’s how a mind grows.',
  'Mistakes are just your brain finding the edges.',
  'You don’t have to be fast today. Just be here.',
  'Curiosity is a superpower. Use it on something small.',
  'Rest is part of training, not a break from it.',
  'Every new thing you try leaves a little trail in your brain.',
  'Progress you can’t see yet is still progress.'
]
const affirmation = AFFIRM[dayNum() % AFFIRM.length]
const hr = new Date().getHours()
const greeting = hr < 5 ? 'Still awake' : hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
</script>
