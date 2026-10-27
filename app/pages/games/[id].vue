<template>
  <GameShell v-if="game" :key="game.id" :game="game" />
</template>
<script setup lang="ts">
const route = useRoute()
const { byId } = useGames()
const game = computed(() => byId(String(route.params.id)))
if (!game.value) throw createError({ statusCode: 404, statusMessage: 'Game not found', fatal: true })
useHead(() => ({ title: `${game.value?.name} | Brain Games` }))
</script>
