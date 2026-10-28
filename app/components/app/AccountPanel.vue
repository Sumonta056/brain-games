<template>
  <div
    class="w-[280px] max-w-[calc(100vw-24px)] rounded-card border border-line bg-surface p-4 text-ink shadow-[0_12px_32px_var(--glow)]"
    data-testid="account-panel"
    :data-state="user ? 'signed-in' : ready ? 'guest' : 'loading'"
  >
    <template v-if="user">
      <div class="mb-3 flex items-center gap-3">
        <img
          v-if="user.photo"
          :src="user.photo"
          alt=""
          referrerpolicy="no-referrer"
          class="size-11 rounded-[50%]"
          data-testid="account-photo"
        />
        <div class="min-w-0">
          <b class="block truncate">{{ user.name }}</b>
          <small class="block truncate text-muted">{{ user.email }}</small>
        </div>
      </div>
      <p v-if="status === 'sync'" class="mt-0 mb-3 rounded-btn bg-peach-bg p-2.5 text-[14px] text-peach-fg">
        {{ copy.account.errors.sync }}
      </p>
      <p v-else class="mt-0 mb-3 flex items-center gap-2 rounded-btn bg-mint-bg p-2.5 text-[14px] text-mint-fg">
        <Icon name="bg:nav-cloud" size="16" />{{ nav.synced }}
      </p>
    </template>
    <template v-else-if="ready">
      <b class="block">{{ nav.guestTitle }}</b>
      <p class="mt-1 mb-3 text-[14px] text-muted">{{ nav.guestBody }}</p>
      <button
        class="mb-2 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-pill border border-line bg-raise px-4 font-medium text-ink"
        @pointerenter="preload"
        @focus="preload"
        @touchstart.passive="preload"
        @click="sync.signIn()"
      >
        <span aria-hidden="true" class="flex"><Icon name="bg:brand-google" size="18" /></span>{{ nav.signInLabel }}
      </button>
      <p v-if="error" class="mt-0 mb-2 text-[14px] text-bad" role="alert">{{ error }}</p>
    </template>
    <div class="flex flex-col border-t border-t-line pt-2">
      <NuxtLink to="/profile" class="flex min-h-11 items-center text-ink no-underline" @click="emit('close')">
        {{ nav.profile }}
      </NuxtLink>
      <button
        v-if="user"
        class="flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 text-left text-ink"
        @click="signOut"
      >
        {{ copy.account.signOut }}
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'

const emit = defineEmits<{ close: [] }>()
const nav = copy.account.nav
const { user, error, ready, preload } = useAuth()
const sync = useCloudSync()
const status = sync.status

function signOut() {
  emit('close')
  sync.signOut()
}
</script>
