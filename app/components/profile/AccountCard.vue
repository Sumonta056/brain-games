<template>
  <div
    class="rounded-card border border-line bg-surface p-5"
    data-testid="account-card"
    :data-state="user ? 'signed-in' : 'guest'"
  >
    <h2 class="mx-0 mt-0 mb-3 font-display text-[21px] leading-[normal] font-bold">{{ a.title }}</h2>
    <template v-if="user">
      <div class="flex items-center gap-3">
        <img
          v-if="user.photo"
          :src="user.photo"
          alt=""
          referrerpolicy="no-referrer"
          class="size-12 rounded-[50%]"
          data-testid="account-photo"
        />
        <div class="min-w-0">
          <p class="m-0 font-bold">{{ fill(a.signedInAs, { name: user.name || user.email }) }}</p>
          <p class="m-0 truncate text-muted">{{ user.email }}</p>
        </div>
      </div>
      <p v-if="status" class="mt-2 mb-3.5 rounded-btn bg-peach-bg p-3 text-peach-fg" role="alert">
        {{ a.errors[status] }}
      </p>
      <p v-else class="mt-2 mb-3.5 rounded-btn bg-mint-bg p-3 text-mint-fg">{{ a.synced }}</p>
      <div class="flex flex-wrap gap-2">
        <button class="ghost min-h-11" @click="sync.signOut()">{{ a.signOut }}</button>
        <button class="ghost min-h-11 text-bad" @click="remove">{{ a.delete }}</button>
      </div>
    </template>
    <template v-else>
      <p class="mt-0 mb-2">{{ a.guestIntro }}</p>
      <ul class="mt-0 mb-3.5 pl-5 text-muted">
        <li v-for="b in a.benefits" :key="b">{{ b }}</li>
      </ul>
      <button
        v-if="ready"
        class="go min-h-11 w-full"
        @pointerenter="preload"
        @focus="preload"
        @touchstart.passive="preload"
        @click="signIn"
      >
        {{ a.signIn }}
      </button>
      <p v-if="tried && error" class="mt-2 mb-0 text-center text-bad" role="alert">{{ error }}</p>
    </template>
    <NuxtLink to="/privacy" class="mt-2 inline-flex min-h-11 items-center text-[14px] text-muted underline">{{
      a.privacyLink
    }}</NuxtLink>
  </div>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'

const a = copy.account
const { user, error, ready, preload } = useAuth()
const sync = useCloudSync()
const status = sync.status
const tried = ref(false)

function signIn() {
  tried.value = true
  sync.signIn()
}

function remove() {
  if (confirm(a.deleteConfirm)) sync.deleteCloud()
}
</script>
