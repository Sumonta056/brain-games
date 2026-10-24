# CLAUDE.md — Brain Garden

Relaxing brain-training website. Nuxt 4 + Vue 3 + TypeScript, client-only (`ssr: false`), progress in localStorage.

## Source of truth

- `docs/design.html`: the approved design and the **reference implementation of all 15 games**. When porting a game, copy the logic of `RUN.<id>` from this file. Don't redesign it.
- `docs/functional-requirements.md`: product and behaviour rules. Read it before changing pages, scoring or progress.
- `app/data/games/<id>.json`: all game content (copy, steps, demo, bands, science, icon). **Never hard-code game copy in components.**
- `app/data/copy.json`: all other content copy (greetings, affirmations, moods, avatars, praise). Import it with `import copy from '~/data/copy.json'`. **Never hard-code content copy in components.**
- `app/assets/css/`: `tokens.css` holds the design tokens from design.html. `main.css` is the Tailwind v4 entry and maps the tokens in `@theme`. `components.css` holds only the base reset, keyframes, `v-html` scene classes and the shared game UI classes that `RUN.<id>` code uses (`@layer components`). Everything else is Tailwind utilities. Don't invent new colours.

## Commands

- Node is pinned in `.nvmrc` (24). Prefix every command with `source ~/.nvm/nvm.sh && nvm use --silent &&`. Never change the nvm default.
- `npm install`, `npm run dev`, `npm run build`, `npm run typecheck`
- `npm run lint`, `npm run lint:fix`, `npm run format`, `npm run format:check`
- `npm test`, `npm run test:watch`, `npm run test:coverage`, `npx vitest run <paths>`
- Keep TypeScript on 5.x (vue-tsc doesn't support TS 7 yet).

## Workflow (enforced)

- Every feature, bug fix, game port, UI tweak or requirement change goes through the `/feature` skill: read → plan → approval → failing specs (`test-writer`) → implement → lint/typecheck/test → UI check (`ui-verifier`) → review (`code-reviewer`) → ask before commit.
- A requirement change edits `docs/functional-requirements.md` first, then the specs, then the code.
- Every source file under `app/` has a spec: `app/<path>/<Name>.<ext>` → `test/nuxt/<path>/<Name>.spec.ts`. Exempt: `app/app.vue`, `app/layouts/**`, `app/components/games/registry.ts`, `app/data/**` (covered by `test/nuxt/data/game-contract.spec.ts` and `copy.spec.ts`), `app/assets/**`, `shared/types/**`. Patterns and pitfalls: `write-unit-tests` skill.
- Hooks in `.claude/settings.json`: after each edit, ESLint + Prettier run on the file; at turn end, `require-tests.sh` blocks on a missing spec or a failing lint, typecheck or test run.
- Git hooks: pre-commit runs lint-staged (ESLint, Prettier, `vitest related`); commit-msg runs commitlint (conventional commits, e.g. `feat(games): port memory pairs`).
- Never commit or push without asking.

## Structure

```
app/
  app.vue                 NuxtLayout + useTheme()
  layouts/default.vue     AppNav + <main> + confetti canvas
  pages/
    index.vue             HomeHero + BentoGrid
    games/index.vue       BentoGrid (all games)
    games/[id].vue        GameShell (404 if unknown id)
    profile.vue
  error.vue
  components/             pathPrefix:false → use file names (<GameTile>)
    app/   AppNav, GameIcon
    home/  HomeHero, DailyFive, MoodCheck, BentoGrid, GameTile
    game/  GameShell, GameSidebar, ReadyScreen, ResultScreen
    games/ one component per game, rendered through registry.ts (registry.ts is not a component: extensions ['vue'])
  composables/            useGames, useProgress, useTheme, useCountdown/useTimeouts, useCheer
  utils/                  bands.ts, random.ts, confetti.ts (auto-imported)
  assets/css/             tokens.css, main.css (Tailwind entry + @theme), components.css
  assets/icons/           nav/, games/, brand/ SVG files (rendered with <Icon name="bg:...">)
  data/games/*.json       15 game definitions; data/categories.json
  data/copy.json          shared UI copy: greetings, affirmations, moods, avatars, praise
shared/types/game.ts      GameDef, Band, Progress types (import from '~~/shared/types/game')
docs/                     design.html, functional-requirements.md, games.json
test/nuxt/                Vitest specs (Nuxt env, happy-dom); fixtures.ts holds shared game fixtures
.claude/                  settings.json, hooks/, skills/ (feature, port-game, write-unit-tests, ui-check),
                          agents/ (test-writer, ui-verifier, code-reviewer)
```

## Rules

1. **Game component contract:** `props: { game: GameDef }`, `emits: finish(score: number)`. Nothing else. GameShell owns the ready → playing → result flow, records the score, and renders the sidebar. A game never touches progress or routing.
2. **Register every game** in `app/components/games/registry.ts` with `defineAsyncComponent`. The key must equal `component` in the JSON. Unregistered games fall back to `ComingSoon.vue`.
3. **Timers:** use `useCountdown` / `useTimeouts` (they auto-clear on unmount). Never use raw `setInterval` in a game without clearing it in `onBeforeUnmount`.
4. **Encouragement:** call `useCheer().cheer()` on milestones. Copy stays positive: never "Wrong!", always "It was X. Carry on from there."
5. **Scoring:** use `bandIndex(game, score)` from `utils/bands.ts`. `lowerIsBetter` flips the comparison, and `at: null` means Infinity.
6. **Progress:** read and write only through `useProgress()`. The storage key `bgarden` must stay compatible with design.html.
7. **Styling:** use Tailwind utilities that map to the tokens (`bg-surface`, `text-accent`, `bg-tint-bg`/`text-tint-fg` for category tint via `tintVars(category)`, `font-display`, `rounded-card`). The default Tailwind palette is off; never use raw colours. Keep keyframes and classes used inside `v-html` scenes in `components.css`. Breakpoints: `max-xl` 1000px, `max-lg` 760px, `max-md` 640px, `max-sm` 560px, `max-xs` 380px. Specs select by `data-testid` / ARIA / `data-state`, never by a styling class. Both themes must work: test light, dark and auto.
8. **Mobile:** test at 360px. Touch targets 44px or larger, the bottom tab bar must not cover content, and inputs need font-size ≥16px.
9. **Accessibility:** real buttons and links, `aria-label` on icon-only buttons, a visible `:focus-visible`, and every game playable by keyboard (Enter/Space).
10. **Trusted HTML:** `v-html` is allowed only for `demo[].scene` from repo JSON. Never for user input.
11. **Icons and images:** every SVG lives as a file in `app/assets/icons/{nav,games,brand}/`. Render it with `<Icon>` from `@nuxt/icon` (`bg:nav-<name>`, `bg:games-<name>`, `bg:brand-<name>`: one collection `bg`, and the folder becomes the name prefix). Never inline SVG markup in a component or JSON.
12. **Science copy:** only cite real norms. If a band isn't from research, the `science` text must say it's a Brain Garden guide.
13. Keep each component under ~150 lines. Split logic into composables before it grows.

## Porting status

Done: MentalMath, ReactionTime, BoxBreathing.
To port from design.html (`RUN.<id>` → `app/components/games/<Component>.vue`):
MemoryPairs (pairs), OddColour (odd), SerialSevens (serial7), WordSprint (words), CategoryChallenge (category), BackwardSpelling (backward), DigitSpan (digits), SequenceMemory (sequence), TwoBack (nback), StroopColours (stroop), SchulteTable (schulte), OtherHandDay (hand).
Tip: WordSprint and CategoryChallenge share `listGame()`. Make a `useListGame` composable.

## Adding a new game

1. Create `app/data/games/<id>.json` following the contract in functional-requirements §4 (3 steps, 3 demo frames, bands from low to high, a science note, a tip, and a 48×48 icon).
2. Write `test/nuxt/components/games/<Component>.spec.ts` first (it must fail), then create `app/components/games/<Component>.vue` that follows the contract above.
3. Register it in `registry.ts`, then run the `ui-verifier` agent on the tile, the ready demo, the result band and the sidebar highlight.

## Later (not built yet)

Accounts and cloud sync (keep the `Progress` shape), leaderboards, more languages (Bangla), and PWA/offline.
