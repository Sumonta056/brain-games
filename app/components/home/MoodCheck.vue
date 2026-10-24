<template>
  <div
    class="relative overflow-hidden rounded-card border border-line bg-surface px-[22px] py-5 max-md:rounded-btn max-md:p-4"
  >
    <h2 class="mx-0 mt-0 mb-2.5 font-display text-[19px] leading-[normal] font-bold">How’s your brain feeling?</h2>
    <div class="grid grid-cols-[repeat(4,1fr)] gap-2">
      <button
        v-for="m in copy.moods"
        :key="m.label"
        class="flex cursor-pointer flex-col items-center gap-0.5 rounded-icon border border-line bg-raise px-0.5 py-2 text-[13px] text-muted aria-pressed:border-accent aria-pressed:bg-rose-bg aria-pressed:text-ink"
        :aria-pressed="picked === m.label"
        @click="picked = m.label"
      >
        <b class="text-[22px] leading-[1.2]">{{ m.emoji }}</b
        >{{ m.label }}
      </button>
    </div>
    <p v-if="!current" class="mx-0 mt-2.5 mb-0 text-[14px] text-muted">Pick one and we’ll suggest games.</p>
    <p v-else class="mx-0 mt-2.5 mb-0 text-[14px] text-muted">
      {{ current.msg }}
      <NuxtLink v-for="id in current.ids" :key="id" :to="`/games/${id}`" class="mr-2.5 font-semibold text-accent">{{
        byId(id)?.name
      }}</NuxtLink>
    </p>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
const { byId } = useGames()
const picked = ref<string | null>(null)
const current = computed(() => copy.moods.find(m => m.label === picked.value))
</script>
