<template>
  <div>
    <ul class="tasks">
      <li v-for="t in tasks" :key="t">
        <label
          ><input v-model="checked" type="checkbox" :value="t" @change="onTick" /><span>{{ t }}</span></label
        >
      </li>
    </ul>
    <canvas
      ref="cv"
      class="pad"
      data-testid="pad"
      role="img"
      aria-label="Drawing pad"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="drawing = false"
    />
    <p class="note">Write your name here with your other hand</p>
    <div class="row">
      <button class="ghost" @click="size">Clear pad</button>
      <button class="go" @click="emit('finish', checked.length)">Finish</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
const props = defineProps<{ game: GameDef }>()
const emit = defineEmits<{ finish: [score: number] }>()
const { cheer } = useCheer()
const r = seeded(dayNum() * 7 + 3)
const tasks = gameContent(props.game, 'tasks')
  .slice()
  .sort(() => r() - 0.5)
  .slice(0, 4)
const checked = ref<string[]>([])
const cv = ref<HTMLCanvasElement>()
let ctx: CanvasRenderingContext2D | null = null
let drawing = false

function onTick(e: Event) {
  if ((e.target as HTMLInputElement).checked) cheer()
}
function size() {
  const c = cv.value
  ctx = c?.getContext('2d') ?? null
  if (!c || !ctx) return
  const rc = c.getBoundingClientRect()
  c.width = rc.width * devicePixelRatio
  c.height = rc.height * devicePixelRatio
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
  ctx.lineWidth = 5
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
}
function down(e: PointerEvent) {
  drawing = true
  cv.value?.setPointerCapture?.(e.pointerId)
  ctx?.beginPath()
  ctx?.moveTo(e.offsetX, e.offsetY)
}
function move(e: PointerEvent) {
  if (!drawing || !ctx) return
  ctx.lineTo(e.offsetX, e.offsetY)
  ctx.stroke()
}
onMounted(size)
</script>
