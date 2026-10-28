<template>
  <div class="page">
    <GuestNotice />
    <section class="grid grid-cols-[320px_1fr] [align-items:start] gap-3.5 max-lg:grid-cols-[1fr]">
      <div>
        <div class="rounded-card border border-line bg-surface p-5">
          <div
            class="mx-auto grid size-[104px] place-items-center rounded-[50%] bg-lilac-bg text-[58px]"
            data-testid="avatar"
          >
            {{ progress.av }}
          </div>
          <div class="mx-0 my-3 flex flex-wrap justify-center gap-1.5" data-testid="avatars">
            <button
              v-for="a in copy.avatars"
              :key="a"
              class="size-[42px] cursor-pointer rounded-[12px] border border-line bg-raise text-[21px] aria-pressed:border-accent aria-pressed:bg-rose-bg"
              :aria-pressed="a === progress.av"
              :aria-label="`Choose ${a}`"
              @click="progress.av = a"
            >
              {{ a }}
            </button>
          </div>
          <input
            v-model.trim="progress.name"
            class="w-full rounded-icon border-2 border-line bg-raise p-1.5 text-center font-display text-[22px] leading-[normal] font-bold"
            placeholder="Your name"
            aria-label="Your name"
            maxlength="24"
          />
          <div class="mt-4 rounded-btn bg-mint-bg p-3.5 text-center text-mint-fg" data-testid="plant">
            <div class="text-[44px]">{{ level.emoji }}</div>
            <b class="block font-display text-[20px] leading-[normal] font-extrabold text-ink">{{ level.name }}</b>
            <small>{{ progress.xp }} growth points · +10 every game</small>
            <div class="mt-2 h-2.5 overflow-hidden rounded-pill bg-surface">
              <i class="block h-full bg-mint-fg" :style="{ width: level.pct + '%' }" />
            </div>
          </div>
        </div>
        <BrainCard class="mt-3.5" />
        <AccountCard class="mt-3.5" />
      </div>
      <div>
        <ProfileStats />
        <FavouriteGame />
        <div class="rounded-card border border-line bg-surface p-5">
          <h2 :class="h2">This week</h2>
          <div class="flex gap-2">
            <div
              v-for="d in week"
              :key="d.key"
              class="group flex-1 text-center text-[13px] text-muted"
              data-testid="week-day"
              :data-state="d.on ? 'on' : undefined"
            >
              <i
                class="mb-1 block h-[34px] rounded-[12px] bg-raise group-data-[state=on]:[background:linear-gradient(140deg,var(--accent-2),var(--accent))]"
              />{{ d.label }}
            </div>
          </div>
        </div>
        <MonthCard v-model:month="month" />
        <GrowthCard :month="month" />
        <div class="mt-3.5 rounded-card border border-line bg-surface p-5">
          <h2 :class="h2">Your brain skills</h2>
          <div
            v-for="s in skills"
            :key="s.cat"
            class="mb-2.5 grid grid-cols-[120px_1fr_60px] items-center gap-3 max-sm:grid-cols-[90px_1fr_50px]"
            data-testid="skill"
            :style="tintVars(s.cat)"
          >
            <b>{{ s.cat }}</b>
            <div class="h-3.5 overflow-hidden rounded-pill bg-raise">
              <i class="block h-full rounded-pill bg-tint-fg" :style="{ width: s.pct + '%' }" />
            </div>
            <small class="text-right text-muted">{{ s.played ? s.pct + '%' : 'not yet' }}</small>
          </div>
        </div>
        <div class="mt-3.5 rounded-card border border-line bg-surface p-5">
          <h2 :class="h2">Recent games</h2>
          <p v-if="!recent.length" class="p-4 text-center text-muted">
            No games yet. Your first one plants the seed 🌱
          </p>
          <ul v-else class="m-0 list-none p-0" data-testid="history">
            <li
              v-for="r in recent"
              :key="r.t"
              class="flex items-center gap-3 border-b border-b-line px-0 py-[9px] [&_svg]:size-[30px] [&_svg]:flex-none"
            >
              <GameIcon :game="r.game" /><span class="flex-1"
                ><b>{{ r.game.name }}</b
                ><br /><small class="text-muted">{{ r.band }}</small></span
              ><span
                ><b>{{ r.s }}</b> <small class="text-muted">{{ r.game.unit }}</small></span
              >
            </li>
          </ul>
          <button class="ghost mt-3.5" @click="confirmReset">Reset all progress</button>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import type { Category } from '~~/shared/types/game'
import copy from '~/data/copy.json'
useHead({ title: 'Your profile | Brain Games' })
const { progress, level, reset } = useProgress()
const { user } = useAuth()
const sync = useCloudSync()
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
    const tops = games.filter(g => g.category === cat).flatMap(g => topBest(g, progress.value.best) ?? [])
    const pct = tops.length
      ? Math.round(
          (tops.reduce((a, { game, score }) => a + (bandIndex(game, score) + 1) / game.bands.length, 0) / tops.length) *
            100
        )
      : 0
    return { cat, pct, played: tops.length > 0 }
  })
)
const h2 = 'mx-0 mt-0 mb-3 font-display text-[21px] leading-[normal] font-bold'
const month = ref(todayKey().slice(0, 7))
const recent = computed(() =>
  progress.value.hist.slice(0, 10).flatMap(x => {
    const base = byId(x.id)
    const g = base && withDifficulty(base, x.l ?? 'medium')
    return g ? [{ ...x, game: g, band: g.bands[bandIndex(g, x.s)]!.label }] : []
  })
)
async function confirmReset() {
  if (!confirm(user.value ? copy.account.resetConfirmCloud : copy.account.resetConfirm)) return
  reset()
  if (user.value) await sync.save()
}
</script>
