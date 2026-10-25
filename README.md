# Brain Garden 🧠🌱

Short, friendly brain games to relax and sharpen your mind. 15 games, no account, no tracking.

![Node](https://img.shields.io/badge/node-24-339933)
![Nuxt](https://img.shields.io/badge/Nuxt-4-00dc82)
![Vue](https://img.shields.io/badge/Vue-3-42b883)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)
![License](https://img.shields.io/badge/license-MIT-blue)

[Install](#install) · [Games](#games) · [Add a game](#add-a-new-game) · [Docs](#documentation)

```bash
nvm use && npm install && npm run dev
```

![Home page](docs/screenshots/home.png)

## Contents

- [Why Brain Garden](#why-brain-garden)
- [Features](#features)
- [Games](#games)
- [Install](#install)
- [Scripts](#scripts)
- [Progress and privacy](#progress-and-privacy)
- [How it works](#how-it-works)
- [Add a new game](#add-a-new-game)
- [Contributing](#contributing)
- [Tests](#tests)
- [Limitations](#limitations)
- [Documentation](#documentation)
- [License](#license)

## Why Brain Garden

Most brain-training apps push streaks, ads and sign-ups. Brain Garden does not.

Each game takes about one minute. The copy is kind: it never says "Wrong!". It says "It was X. Carry on from there."

The app runs fully in your browser. Your progress stays on your device.

## Features

- **15 short games** in 6 categories: Calm, Speed, Words, Memory, Focus and Body.
- **Today's Five**: a daily set of 5 games.
- **Mood check**: pick how you feel and get game suggestions.
- **Bands, not grades**: each result maps to a friendly band. Where a band comes from research, the science note names the source. Where it does not, the note says it is a Brain Garden guide.
- **Streak and best scores** on the profile page.
- **Light, dark and auto themes.**
- **Keyboard play**: every game works with Enter and Space.
- **Mobile ready**: tested at 360px, with 44px touch targets.

| Game list                                | Ready screen                                          | Mobile                                      |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------- |
| ![All games](docs/screenshots/games.png) | ![Game ready screen](docs/screenshots/game-ready.png) | ![Mobile home](docs/screenshots/mobile.png) |

## Games

| Game               | Category | What you do                                        |
| ------------------ | -------- | -------------------------------------------------- |
| Box breathing      | Calm     | Breathe with a growing circle for one minute.      |
| Memory pairs       | Calm     | Flip cards and find matching pairs.                |
| Odd colour out     | Calm     | Spot the one tile with a slightly different shade. |
| Mental math        | Speed    | Solve sums that get harder the faster you go.      |
| Reaction time      | Speed    | Tap the moment the box turns green.                |
| Serial sevens      | Speed    | Count down by 7 from a random number.              |
| Backward spelling  | Words    | See a word, then spell it in reverse.              |
| Category challenge | Words    | Name things in a category before time runs out.    |
| Word sprint        | Words    | Write as many words as you can from one letter.    |
| Digit span         | Memory   | Remember a growing string of numbers.              |
| 2-back             | Memory   | Spot a letter that matches the one two steps ago.  |
| Sequence memory    | Memory   | Repeat the pattern of lit squares.                 |
| Schulte table      | Focus    | Find 1 to 25 in a scrambled grid.                  |
| Stroop colours     | Focus    | Pick the ink colour, not the word.                 |
| Other hand day     | Body     | Do today's tasks with your other hand.             |

## Install

Requires Node 24. The version is pinned in `.nvmrc`.

```bash
git clone https://github.com/Sumonta056/brain-games.git
cd brain-games
nvm use
npm install
npm run dev
```

Open `http://localhost:3000`.

To make a production build:

```bash
npm run build
npm run preview
```

## Scripts

| Command                                   | What it does                           |
| ----------------------------------------- | -------------------------------------- |
| `npm run dev`                             | Start the dev server on port 3000.     |
| `npm run build`                           | Make a production build.               |
| `npm run generate`                        | Make a static site.                    |
| `npm run preview`                         | Serve the production build.            |
| `npm run typecheck`                       | Check types with `vue-tsc`.            |
| `npm run lint` / `npm run lint:fix`       | Run ESLint, with or without fixes.     |
| `npm run format` / `npm run format:check` | Run Prettier, with or without writes.  |
| `npm test`                                | Run all specs once.                    |
| `npm run test:watch`                      | Run specs in watch mode.               |
| `npm run test:coverage`                   | Run specs and write a coverage report. |

## Progress and privacy

| Item     | Behaviour                                              |
| -------- | ------------------------------------------------------ |
| Storage  | Progress is in `localStorage` under the key `bgarden`. |
| Server   | None. The app is client-only (`ssr: false`).           |
| Account  | None.                                                  |
| Tracking | None.                                                  |
| Reset    | Clear the site data in your browser.                   |

## How it works

Nuxt 4, Vue 3 and TypeScript, with Tailwind v4 for styles. The design tokens are in `app/assets/css/tokens.css`.

```
app/
  pages/              index, games/index, games/[id], profile
  components/
    app/              AppNav, GameIcon
    home/             HomeHero, DailyFive, MoodCheck, BentoGrid, GameTile
    game/             GameShell, GameSidebar, ReadyScreen, ResultScreen
    games/            one component per game, plus registry.ts
  composables/        useGames, useProgress, useTheme, useCountdown, useCheer, useListGame
  utils/              bands.ts, random.ts, confetti.ts
  data/games/*.json   the 15 game definitions
  data/copy.json      shared UI copy
shared/types/game.ts  GameDef, Band, Progress
docs/                 design.html, functional-requirements.md, games.json
test/nuxt/            Vitest specs
```

Each game follows one contract:

- **Props:** `game: GameDef`.
- **Emits:** `finish(score: number)`.

`GameShell` owns the ready, playing and result flow. It records the score and shows the sidebar. A game never touches progress or routing.

All game copy lives in `app/data/games/<id>.json`. No component holds game copy.

## Add a new game

1. Create `app/data/games/<id>.json`. Give it 3 steps, 3 demo frames, bands from low to high, a science note, a tip and a 48×48 icon.
2. Write `test/nuxt/components/games/<Component>.spec.ts` first. It must fail. Then create `app/components/games/<Component>.vue`.
3. Register the game in `app/components/games/registry.ts` with `defineAsyncComponent`. The key must equal `component` in the JSON.

Read `docs/functional-requirements.md` section 4 for the full JSON contract.

## Contributing

1. Run `nvm use` before every command.
2. Use the `/feature` skill in Claude Code for every change. The steps are: plan, approval, failing specs, implement, lint, typecheck, test, UI check, review.
3. Give every file under `app/` a spec at `test/nuxt/<path>/<Name>.spec.ts`.
4. Write Conventional Commits, for example `feat(games): port memory pairs`. A `commit-msg` hook checks them.
5. A pre-commit hook runs ESLint, Prettier and the related specs.

`CLAUDE.md` holds the full rules.

## Tests

Vitest runs in a Nuxt environment with happy-dom.

```bash
npm test
npm run test:coverage
npx vitest run test/nuxt/components/games
```

Specs select elements by `data-testid`, ARIA role or `data-state`. They never select by a styling class.

## Limitations

1. Progress does not sync between devices.
2. Clearing browser data erases progress.
3. English only.
4. No offline mode yet.

Planned: accounts and cloud sync, leaderboards, more languages (Bangla), and PWA support.

## Documentation

| File                              | Content                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| `docs/design.html`                | The approved design. Open it in a browser to play all 15 games. |
| `docs/functional-requirements.md` | Product and behaviour rules.                                    |
| `docs/games.json`                 | Game catalogue.                                                 |
| `CLAUDE.md`                       | Rules for Claude Code and for contributors.                     |

## License

MIT © 2026 Sumonta Saha Mridul
