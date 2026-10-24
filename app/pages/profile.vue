<template>
  <div class="page">
    <section class="prof">
      <div class="panel">
        <div class="avatar">{{ progress.av }}</div>
        <div class="avs">
          <button
            v-for="a in AV"
            :key="a"
            :aria-pressed="a === progress.av"
            :aria-label="`Choose ${a}`"
            @click="progress.av = a"
          >
            {{ a }}
          </button>
        </div>
        <input
          v-model.trim="progress.name"
          class="namein"
          placeholder="Your name"
          aria-label="Your name"
          maxlength="24"
        />
        <div class="plant">
          <div class="p">{{ level.emoji }}</div>
          <b>{{ level.name }}</b>
          <small>{{ progress.xp }} growth points · +10 every game</small>
          <div class="xp"><i :style="{ width: level.pct + '%' }" /></div>
        </div>
      </div>
      <div>
        <div class="stats">
          <div class="stat" style="background: var(--peach-bg)">
            <b>🔥 {{ streak }}</b
            ><span>day streak</span>
          </div>
          <div class="stat" style="background: var(--lilac-bg)">
            <b>{{ progress.hist.length }}</b
            ><span>games played</span>
          </div>
          <div class="stat" style="background: var(--mint-bg)">
            <b>{{ Object.keys(progress.best).length }} / {{ games.length }}</b
            ><span>games tried</span>
          </div>
        </div>
        <div class="panel">
          <h2>This week</h2>
          <div class="week">
            <div v-for="d in week" :key="d.key"><i :class="{ on: d.on }" />{{ d.label }}</div>
          </div>
        </div>
        <div class="panel" style="margin-top: 14px">
          <h2>Your brain skills</h2>
          <div v-for="s in skills" :key="s.cat" class="skill" :style="tintVars(s.cat)">
            <b>{{ s.cat }}</b>
            <div class="t"><i :style="{ width: s.pct + '%' }" /></div>
            <small>{{ s.played ? s.pct + '%' : 'not yet' }}</small>
          </div>
        </div>
        <div class="panel" style="margin-top: 14px">
          <h2>Recent games</h2>
          <p v-if="!recent.length" class="empty">No games yet. Your first one plants the seed 🌱</p>
          <ul v-else class="hist">
            <li v-for="r in recent" :key="r.t">
              <GameIcon :game="r.game" /><span class="l"
                ><b>{{ r.game.name }}</b
                ><br /><small>{{ r.band }}</small></span
              ><span
                ><b>{{ r.s }}</b> <small>{{ r.game.unit }}</small></span
              >
            </li>
          </ul>
          <button class="ghost" style="margin-top: 14px" @click="confirmReset">Reset all progress</button>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { Category } from '~~/shared/types/game'
useHead({ title: 'Your profile — Brain Garden' })
const AV = ['🦉', '🐼', '🦊', '🐢', '🐬', '🌻', '🐝', '🌙', '⭐', '🍀']
const { progress, streak, level, reset } = useProgress()
const { games, categories, byId, tintVars } = useGames()
const week = computed(() =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return {
      key: todayKey(d),
      on: progress.value.days.includes(todayKey(d)),
      label: d.toLocaleDateString(undefined, { weekday: 'short' })
    }
  })
)
const skills = computed(() =>
  (Object.keys(categories) as Category[]).map(cat => {
    const gs = games.filter(g => g.category === cat && progress.value.best[g.id] != null)
    const pct = gs.length
      ? Math.round(
          (gs.reduce((a, g) => a + (bandIndex(g, progress.value.best[g.id]!) + 1) / g.bands.length, 0) / gs.length) *
            100
        )
      : 0
    return { cat, pct, played: gs.length > 0 }
  })
)
const recent = computed(() =>
  progress.value.hist.slice(0, 10).flatMap(x => {
    const g = byId(x.id)
    return g ? [{ ...x, game: g, band: g.bands[bandIndex(g, x.s)]!.label }] : []
  })
)
function confirmReset() {
  if (confirm('Clear your profile and all scores in this browser?')) reset()
}
</script>
<style scoped>
.hist li svg {
  width: 30px;
  height: 30px;
  flex: none;
}
</style>
