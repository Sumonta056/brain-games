<template>
  <div class="flex min-h-full flex-col">
    <div class="page pt-20 text-center">
      <p class="mid">{{ error?.statusCode === 404 ? 'That game wandered off 🌱' : 'Something went wrong' }}</p>
      <button class="go" @click="clearError({ redirect: '/games' })">Back to games</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>
