<template>
  <div ref="root" class="relative" data-testid="account-menu" @focusout="onFocusOut">
    <button
      ref="chip"
      class="flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line bg-surface py-1 pr-3 pl-1 text-[15px] font-medium text-ink data-[state=guest]:border-dashed data-[state=guest]:border-muted max-lg:pr-1"
      data-testid="account-chip"
      :data-state="state"
      :aria-label="label"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? panelId : undefined"
      @click="open = !open"
    >
      <span class="relative grid size-[34px] place-items-center rounded-[50%] bg-lilac-bg text-[18px]">
        <img
          v-if="photo"
          :src="photo"
          alt=""
          referrerpolicy="no-referrer"
          class="size-[34px] rounded-[50%]"
          data-testid="account-photo"
          @error="broken = true"
        />
        <template v-else>{{ progress.av }}</template>
        <i
          v-if="state !== 'loading'"
          class="absolute -right-0.5 -bottom-0.5 size-3 rounded-[50%] border-2 border-surface bg-good data-[state=error]:bg-accent data-[state=guest]:border-muted data-[state=guest]:bg-surface"
          data-testid="cloud-badge"
          :data-state="dot"
        />
      </span>
      <span v-if="state !== 'loading'" class="max-lg:hidden">{{ state === 'guest' ? nav.guest : first }}</span>
      <Icon name="bg:nav-chevron" size="16" class="text-muted max-lg:hidden" />
    </button>
    <div v-if="open" :id="panelId" class="absolute top-full right-0 z-20 mt-2">
      <AccountPanel @close="close(true)" />
    </div>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'

const nav = copy.account.nav
const { user, ready } = useAuth()
const { status } = useCloudSync()
const { progress } = useProgress()
const route = useRoute()
const root = ref<HTMLElement>()
const chip = ref<HTMLButtonElement>()
const open = ref(false)
const broken = ref(false)
const panelId = useId()

const state = computed(() => (user.value ? 'signed-in' : ready.value ? 'guest' : 'loading'))
const dot = computed(() => (state.value === 'guest' ? 'guest' : status.value === 'sync' ? 'error' : 'synced'))
const photo = computed(() => (broken.value ? '' : (user.value?.photo ?? '')))
const first = computed(
  () => user.value?.name.trim().split(/\s+/)[0] || progress.value.name || user.value?.email.split('@')[0] || ''
)
const label = computed(() => {
  if (state.value === 'loading') return nav.chipLoading
  if (state.value === 'guest') return nav.chipGuest
  if (!first.value) return nav.menuLabel
  return fill(status.value === 'sync' ? nav.chipError : nav.chipSignedIn, { name: first.value })
})

function close(focus: boolean) {
  open.value = false
  if (focus) chip.value?.focus()
}
const onKey = (e: KeyboardEvent) => {
  if (open.value && e.key === 'Escape') close(true)
}
const onFocusOut = (e: FocusEvent) => {
  const next = e.relatedTarget as Node | null
  if (open.value && next && !root.value?.contains(next)) close(false)
}
const onOutside = (e: Event) => {
  if (open.value && !root.value?.contains(e.target as Node)) close(false)
}
watch(
  () => route.fullPath,
  () => close(false)
)
watch(
  () => user.value?.photo,
  () => (broken.value = false)
)
onMounted(() => {
  document.addEventListener('keydown', onKey)
  document.addEventListener('pointerdown', onOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  document.removeEventListener('pointerdown', onOutside)
})
</script>
