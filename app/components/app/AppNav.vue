<template>
  <header class="nav">
    <div class="nav-in">
      <NuxtLink to="/" class="logo" aria-label="Brain Garden home"><BrainLogo />Brain Garden</NuxtLink>
      <nav class="tabs" aria-label="Main">
        <NuxtLink
          v-for="t in tabs"
          :key="t.to"
          :to="t.to"
          class="tab"
          :aria-current="isActive(t.to) ? 'page' : undefined"
          :aria-label="t.label"
        >
          <NavIcon :name="t.icon" /><span class="tl">{{ t.label }}</span>
        </NuxtLink>
      </nav>
      <div class="nav-r">
        <span class="streak"><NavIcon name="flame" :size="18" />{{ streak }}</span>
        <button
          class="iconbtn"
          :aria-label="`Theme: ${theme}. Click to change`"
          :title="`Theme: ${theme}`"
          @click="cycle"
        >
          <NavIcon :name="theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'auto'" />
        </button>
        <NuxtLink to="/profile" class="me" aria-label="Open your profile">
          <span class="av">{{ progress.av }}</span
          ><span class="nmx">{{ progress.name || 'Profile' }} · {{ level.emoji }}</span>
        </NuxtLink>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
const route = useRoute()
const { progress, streak, level } = useProgress()
const { theme, cycle } = useTheme()
const tabs = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/games', label: 'Games', icon: 'games' },
  { to: '/profile', label: 'Profile', icon: 'user' }
] as const
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>
<style scoped>
.logo,
.tab,
.me {
  text-decoration: none;
}
</style>
