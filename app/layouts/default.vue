<template>
  <div class="flex min-h-full flex-col">
    <AppNav />
    <main class="w-full flex-1 max-md:pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))]"><slot /></main>
    <canvas id="confetti" class="pointer-events-none fixed inset-0 z-20" aria-hidden="true" />
  </div>
</template>
