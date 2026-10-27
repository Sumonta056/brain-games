<template>
  <dialog
    ref="root"
    data-testid="level-up"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    class="m-auto w-[min(420px,calc(100%_-_32px))] max-w-none animate-[level-up_0.45s_ease-out] rounded-card border border-line bg-surface p-6 text-center text-ink backdrop:bg-[color-mix(in_srgb,var(--bg)_70%,transparent)]"
    @keydown="onKey"
    @cancel.prevent="$emit('close')"
  >
    <div class="text-[44px] leading-none" aria-hidden="true">
      {{ next ? copy.levelUp.emoji : copy.levelUp.topEmoji }}
    </div>
    <h2 :id="titleId" class="my-2 font-display text-[28px] font-extrabold">
      {{ next ? fill(copy.levelUp.title) : copy.levelUp.topTitle }}
    </h2>
    <p class="text-muted">{{ next ? fill(copy.levelUp.ask) : copy.levelUp.topBody }}</p>
    <div class="row">
      <template v-if="next">
        <button class="go max-sm:w-full" @click="$emit('play')">
          {{ fill(copy.levelUp.play) }}
        </button>
        <button class="ghost max-sm:w-full" @click="$emit('close')">
          {{ fill(copy.levelUp.stay) }}
        </button>
      </template>
      <button v-else class="go max-sm:w-full" @click="$emit('close')">
        {{ copy.levelUp.done }}
      </button>
    </div>
  </dialog>
</template>
<script setup lang="ts">
import copy from '~/data/copy.json'
import type { Difficulty } from '~~/shared/types/game'

const props = defineProps<{ level: Difficulty; next: Difficulty | null }>()
const emit = defineEmits<{ play: []; close: [] }>()

const titleId = useId()
const root = ref<HTMLDialogElement>()

function fill(text: string) {
  return text
    .replace('{level}', copy.difficulty[props.level])
    .replace('{next}', props.next ? copy.difficulty[props.next] : '')
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    return emit('close')
  }
  if (e.key !== 'Tab') return
  const items = [...(e.currentTarget as HTMLElement).querySelectorAll('button')]
  const first = items[0]
  const last = items[items.length - 1]
  if (document.activeElement === (e.shiftKey ? first : last)) {
    e.preventDefault()
    ;(e.shiftKey ? last : first)?.focus()
  }
}

onMounted(() => {
  if (root.value && !root.value.open) {
    if (root.value.showModal) root.value.showModal()
    else root.value.show()
  }
  confetti()
  root.value?.querySelector('button')?.focus()
})
</script>
