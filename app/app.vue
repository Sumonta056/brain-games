<template>
  <NuxtLayout><NuxtPage /></NuxtLayout>
</template>
<script setup lang="ts">
useTheme() // applies data-theme on <html>
useCloudSync().start()
</script>
