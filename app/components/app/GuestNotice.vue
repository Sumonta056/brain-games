<template>
  <div
    v-if="show"
    class="mb-3.5 flex items-start gap-3 rounded-card border border-line bg-sun-bg p-4 text-sun-fg"
    role="note"
    data-testid="guest-notice"
  >
    <span class="text-[22px] leading-none" aria-hidden="true">🌱</span>
    <p class="m-0 flex-1 text-[15px] text-ink">{{ copy.account.notice }}</p>
    <button
      class="grid size-11 flex-none cursor-pointer place-items-center rounded-[12px] border border-line bg-surface text-ink"
      :aria-label="copy.account.noticeClose"
      @click="close"
    >
      <span aria-hidden="true">✕</span>
    </button>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'

const KEY = 'bgarden-notice'
const { user } = useAuth()
const closed = ref(read())
const show = computed(() => !user.value && !closed.value)

function read() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
function close() {
  closed.value = true
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    /* storage blocked */
  }
}
</script>
