<template>
  <div class="app">
    <div class="page center" style="padding-top: 80px">
      <p class="mid">{{ error?.statusCode === 404 ? 'That game wandered off 🌱' : 'Something went wrong' }}</p>
      <button class="go" @click="clearError({ redirect: '/games' })">Back to games</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { NuxtError } from '#app'
defineProps<{ error: NuxtError }>()
</script>
