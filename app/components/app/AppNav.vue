<template>
  <header
    class="sticky top-[env(safe-area-inset-top,0px)] z-9 h-nav border-b border-b-line bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] backdrop-blur-[10px] max-md:bg-surface max-md:backdrop-filter-none"
  >
    <div class="mx-auto flex h-full max-w-page items-center gap-3.5 px-5 max-md:gap-2 max-md:px-3">
      <NuxtLink
        to="/"
        class="flex cursor-pointer items-center gap-2 p-0 font-display text-[22px] leading-none font-extrabold text-ink no-underline max-md:min-h-11 max-md:min-w-11 max-md:text-[19px] max-xs:gap-0 max-xs:text-[0px]"
        aria-label="Brain Games home"
        ><Icon name="bg:brand-logo" width="unset" height="unset" class="size-[34px] max-md:size-[30px]" />Brain
        Games</NuxtLink
      >
      <nav
        class="ml-4 flex gap-1 max-lg:ml-1 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-9 max-md:m-0 max-md:justify-around max-md:border-t max-md:border-t-line max-md:bg-surface max-md:px-2 max-md:pt-1.5 max-md:pb-[calc(6px+env(safe-area-inset-bottom,0px))]"
        aria-label="Main"
      >
        <NuxtLink
          v-for="t in tabs"
          :key="t.to"
          :to="t.to"
          class="flex cursor-pointer items-center gap-[7px] rounded-pill px-3.5 py-2 text-[15px] font-medium text-muted no-underline aria-[current=page]:bg-rose-bg aria-[current=page]:text-rose-fg max-md:min-w-[72px] max-md:flex-col max-md:gap-0.5 max-md:px-[18px] max-md:py-1.5 max-md:text-[12px] max-xs:min-w-0 max-xs:px-2.5"
          :aria-current="isActive(t.to) ? 'page' : undefined"
          :aria-label="t.label"
        >
          <Icon :name="`bg:nav-${t.icon}`" size="20" class="size-[18px] max-md:size-[22px]" /><span
            class="max-lg:hidden max-md:inline"
            >{{ t.label }}</span
          >
        </NuxtLink>
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <span
          class="flex items-center gap-1 rounded-pill bg-peach-bg px-3 py-1 font-display text-[16px] leading-[normal] font-bold text-peach-fg max-lg:hidden"
          data-testid="streak"
          ><Icon name="bg:nav-flame" size="18" />{{ streak }}</span
        >
        <button
          class="iconbtn"
          :aria-label="`Theme: ${theme}. Click to change`"
          :title="`Theme: ${theme}`"
          @click="cycle"
        >
          <Icon :name="`bg:nav-${theme === 'dark' ? 'moon' : theme === 'light' ? 'sun' : 'auto'}`" size="20" />
        </button>
        <AccountMenu />
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
const route = useRoute()
const { streak } = useProgress()
const { theme, cycle } = useTheme()
const tabs = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/games', label: 'Games', icon: 'games' },
  { to: '/profile', label: 'Profile', icon: 'user' }
] as const
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>
