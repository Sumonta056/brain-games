<template>
  <div>
    <div class="bar"><i :style="{ width: fraction * 100 + '%' }" /></div>
    <div class="hud">
      <span>Press Enter after each one</span><span data-testid="score">Score {{ items.length }}</span>
    </div>
    <div class="mid" data-testid="prompt">{{ title }}</div>
    <input
      ref="inp"
      v-model="answer"
      class="field"
      autocomplete="off"
      autocapitalize="off"
      aria-label="Your answer"
      @keydown.enter="onEnter"
    />
    <p class="note" :class="{ ok: feedback.ok }" data-testid="feedback" :data-state="feedbackState">
      {{ feedback.text }}
    </p>
    <div class="list">
      <span v-for="w in items" :key="w" data-testid="item">{{ w }}</span>
    </div>
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{ title: string; seconds: number; check: (w: string) => string | null }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { items, feedback, submit, fraction, start } = useListGame(props.check, props.seconds, n => emit('finish', n))
const answer = ref('')
const inp = ref<HTMLInputElement>()
const feedbackState = computed(() => (feedback.value.text ? (feedback.value.ok ? 'ok' : 'error') : undefined))

function onEnter() {
  submit(answer.value)
  answer.value = ''
}
onMounted(() => {
  start()
  inp.value?.focus()
})
</script>
