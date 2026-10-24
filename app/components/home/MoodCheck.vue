<template>
  <div class="hcard mood">
    <h2>How’s your brain feeling?</h2>
    <div class="moods">
      <button v-for="m in moods" :key="m.label" :aria-pressed="picked === m.label" @click="picked = m.label">
        <b>{{ m.emoji }}</b
        >{{ m.label }}
      </button>
    </div>
    <p v-if="!current">Pick one and we’ll suggest games.</p>
    <p v-else>
      {{ current.msg }}
      <NuxtLink v-for="id in current.ids" :key="id" :to="`/games/${id}`">{{ byId(id)?.name }}</NuxtLink>
    </p>
  </div>
</template>
<script setup lang="ts">
const { byId } = useGames()
const moods = [
  { emoji: '😌', label: 'Calm', ids: ['breath', 'pairs', 'odd'], msg: 'Keep the peace:' },
  { emoji: '😴', label: 'Tired', ids: ['breath', 'sequence', 'category'], msg: 'Go easy:' },
  { emoji: '😤', label: 'Stressed', ids: ['breath', 'odd', 'hand'], msg: 'Breathe first:' },
  { emoji: '⚡', label: 'Energised', ids: ['reaction', 'math', 'stroop'], msg: 'Use that spark:' }
]
const picked = ref<string | null>(null)
const current = computed(() => moods.find(m => m.label === picked.value))
</script>
<style scoped>
.mood p a {
  color: var(--accent);
  font-weight: 600;
  margin-right: 10px;
}
</style>
