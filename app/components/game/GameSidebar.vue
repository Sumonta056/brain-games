<template>
  <aside class="side">
    <div class="sbox">
      <h2><i />How to play</h2>
      <ol class="steps">
        <li v-for="s in game.steps" :key="s">{{ s }}</li>
      </ol>
    </div>
    <div class="sbox">
      <h2><i />What your score means</h2>
      <div class="bands">
        <div v-for="(b, i) in game.bands" :key="b.label" :class="{ here: i === here }">
          <span>{{ b.label }}</span
          ><span>{{ b.range }}</span>
        </div>
      </div>
      <p class="sci" style="margin-top: 8px">
        {{ game.lowerIsBetter ? 'Lower is better. ' : ''
        }}{{ here >= 0 ? 'Highlighted: where your score sits.' : 'Play once to see where you land.' }}
      </p>
    </div>
    <div class="sbox">
      <h2><i />The science</h2>
      <p class="sci">{{ game.science }}<br /><br /><b>Tip:</b> {{ game.tip }}</p>
    </div>
  </aside>
</template>
<script setup lang="ts">
import type { GameDef } from '~~/shared/types/game'
defineProps<{ game: GameDef; here: number }>()
</script>
