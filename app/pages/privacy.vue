<template>
  <div class="page">
    <article class="mx-auto max-w-[720px] rounded-card border border-line bg-surface p-6 max-md:p-4">
      <h1 class="mx-0 mt-0 mb-2 font-display text-[34px] leading-[normal] font-extrabold">{{ p.title }}</h1>
      <p class="mt-0 mb-5 text-muted">{{ p.intro }}</p>
      <section v-for="s in p.sections" :key="s.heading" class="mb-4">
        <h2 class="mx-0 mt-0 mb-1.5 font-display text-[21px] leading-[normal] font-bold">{{ s.heading }}</h2>
        <p class="m-0">{{ s.body }}</p>
      </section>
      <NuxtLink to="/profile" class="ghost mt-2 inline-flex min-h-11 items-center text-inherit no-underline">{{
        p.back
      }}</NuxtLink>
    </article>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'

const p = copy.account.privacy
useHead({ title: 'Privacy | Brain Games' })
</script>
